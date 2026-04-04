//+------------------------------------------------------------------+
//| GMRFX_CopyTrader.mq4                                             |
//| Copy trading dari akun komunitas GMR FX (MT4)                    |
//|                                                                  |
//| Cara pakai:                                                       |
//|  1. Klik tombol "Copy" di halaman komunitas publisher.           |
//|  2. Simpan token yang muncul (hanya tampil sekali).              |
//|     Jika hilang: Profil → Portofolio → Komunitas → Mengikuti    |
//|     → Token EA CopyTrader → Regenerasi.                         |
//|  3. Isi InpCopyToken dengan token tersebut di sini.              |
//|  4. Izinkan URL di Tools → Options → Expert Advisors.            |
//|  5. Pasang di chart manapun.                                     |
//|                                                                  |
//| Satu token = satu publisher. Untuk copy banyak publisher:        |
//|  pasang EA ini beberapa kali dengan InpCopyToken & InpMagic      |
//|  yang berbeda (masing-masing untuk satu publisher).              |
//+------------------------------------------------------------------+
#property copyright "GMR FX"
#property link      "https://gmrfx.app"
#property version   "3.01"
#property description "Copy trading GMR FX. Isi InpCopyToken dari halaman Komunitas → Mengikuti."
#property strict

extern string  InpApiBase      = "https://gmrfx.app"; // URL API
extern string  InpCopyToken    = "";                   // Token copy dari halaman "Mengikuti"
extern int     InpIntervalSec  = 10;                   // Interval polling detik (min 5)
extern int     InpMagic        = 20250401;             // Magic number unik per publisher

// Volume: 0=Fixed lot, 1=Proporsional × Ratio
extern int     InpVolumeMode   = 0;
extern double  InpFixedLot     = 0.01;
extern double  InpRatio        = 1.0;

extern bool    InpCopyClose    = true;
extern bool    InpCopySL       = true;
extern bool    InpCopyTP       = true;
extern bool    InpUseSuffix    = false;
extern string  InpSuffix       = "";
extern int     InpSlippage     = 3;      // pips
extern string  InpSymbolFilter = "";

//--- State
datetime g_nextRun     = 0;
int      g_failCount   = 0;
bool     g_paused      = false;
string   g_etag        = "";
string   g_pubLabel    = "";

struct PubPos
{
   string pubTicket;
   string symbol;
   int    side;
   double volume;
   double sl;
   double tp;
};

PubPos g_pos[2000];
int    g_posN = 0;

void Log(const string m){Print("[GMRFX-Copy] ",m);}

string MakeCmt(const string pk){return "GMRFX_CP_"+IntegerToString(InpMagic)+":"+pk;}
bool IsCopyCmt(const string c){return StringFind(c,"GMRFX_CP_"+IntegerToString(InpMagic)+":")>=0;}
string GetPubTk(const string c){string pfx="GMRFX_CP_"+IntegerToString(InpMagic)+":";if(StringFind(c,pfx)==0)return StringSubstr(c,StringLen(pfx));return "";}

string LocalSym(const string s)
{
   if(!InpUseSuffix||StringLen(InpSuffix)==0)return s;
   // Cek versi suffix dulu — jika ada bid, prioritaskan
   string ws=s+InpSuffix;if(MarketInfo(ws,MODE_BID)>0)return ws;
   if(MarketInfo(s,MODE_BID)>0)return s;
   return s;
}

bool SymOk(const string sym)
{
   if(StringLen(InpSymbolFilter)==0)return true;
   string s=InpSymbolFilter+",";string su=sym;StringToUpper(su);
   int from=0;
   while(from<StringLen(s)){int sep=StringFind(s,",",from);if(sep<0)break;string tok=StringSubstr(s,from,sep-from);StringTrimLeft(tok);StringTrimRight(tok);StringToUpper(tok);if(StringLen(tok)>0&&StringFind(su,tok)>=0)return true;from=sep+1;}
   return false;
}

double CalcVol(const double pv,const string sym)
{
   double v=(InpVolumeMode==1)?pv*MathMax(0.001,InpRatio):InpFixedLot;
   double step=MarketInfo(sym,MODE_LOTSTEP);double mn=MarketInfo(sym,MODE_MINLOT);double mx=MarketInfo(sym,MODE_MAXLOT);
   if(step<=0)step=0.01;
   if(mn<=0)mn=0.01;   // fallback jika simbol belum di-subscribe Market Watch
   if(mx<=0)mx=100.0;
   v=MathFloor(v/step)*step;
   return NormalizeDouble(MathMax(mn,MathMin(mx,v)),2);
}

int FindLocal(const string pubTk)
{
   string ct=MakeCmt(pubTk);
   for(int i=OrdersTotal()-1;i>=0;i--){if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES))continue;if(OrderMagicNumber()!=InpMagic)continue;if(OrderType()>1)continue;if(OrderComment()==ct)return OrderTicket();}
   return -1;
}

void OpenPos(const PubPos &p)
{
   string sym=LocalSym(p.symbol);if(!SymOk(sym)){Log("Skip filter: "+sym);return;}
   double vol=CalcVol(p.volume,sym);if(vol<=0){Log("Vol 0 skip "+sym);return;}
   RefreshRates();
   int dig=(int)MarketInfo(sym,MODE_DIGITS);double pt=MarketInfo(sym,MODE_POINT);if(pt<=0)pt=0.00001;
   double sl=(InpCopySL&&p.sl>0)?NormalizeDouble(p.sl,dig):0;
   double tp=(InpCopyTP&&p.tp>0)?NormalizeDouble(p.tp,dig):0;
   string cmt=MakeCmt(p.pubTicket);int slip=InpSlippage*10;
   int tk=(p.side==0)?OrderSend(sym,OP_BUY,vol,Ask,slip,sl,tp,cmt,InpMagic,0,clrBlue):OrderSend(sym,OP_SELL,vol,Bid,slip,sl,tp,cmt,InpMagic,0,clrRed);
   if(tk>=0)Log("BUKA "+(p.side==0?"BUY":"SELL")+" "+sym+" lot="+DoubleToString(vol,2)+" pub="+p.pubTicket);
   else Log("GAGAL buka "+sym+" err="+IntegerToString(GetLastError()));
}

void CloseLoc(const int tk)
{
   if(!OrderSelect(tk,SELECT_BY_TICKET))return;
   string sym=OrderSymbol();RefreshRates();
   double cp=(OrderType()==OP_BUY)?Bid:Ask;
   if(!OrderClose(tk,OrderLots(),cp,InpSlippage*10,clrYellow))Log("GAGAL tutup "+IntegerToString(tk));
   else Log("TUTUP "+IntegerToString(tk));
}

void SyncSlTp(const int tk,const PubPos &p)
{
   if(!OrderSelect(tk,SELECT_BY_TICKET))return;
   string sym=OrderSymbol();int dig=(int)MarketInfo(sym,MODE_DIGITS);double pt=MarketInfo(sym,MODE_POINT);if(pt<=0)pt=0.00001;
   double cSL=OrderStopLoss(),cTP=OrderTakeProfit();
   double nSL=(InpCopySL&&p.sl>0)?NormalizeDouble(p.sl,dig):cSL;
   double nTP=(InpCopyTP&&p.tp>0)?NormalizeDouble(p.tp,dig):cTP;
   if(MathAbs(nSL-cSL)<pt*2&&MathAbs(nTP-cTP)<pt*2)return;
   OrderModify(tk,OrderOpenPrice(),nSL,nTP,0,clrNONE);
}

//--- JSON helpers
string JStr(const string j,const string k){string p="\""+k+"\":\"";int i=StringFind(j,p);if(i<0)return "";int s=i+StringLen(p),e=StringFind(j,"\"",s);if(e<s)return "";return StringSubstr(j,s,e-s);}
double JNum(const string j,const string k){string p="\""+k+"\":";int i=StringFind(j,p);if(i<0)return 0;int s=i+StringLen(p);while(s<StringLen(j)&&StringGetCharacter(j,s)==' ')s++;int e=s;while(e<StringLen(j)){ushort c=StringGetCharacter(j,e);if(c==','||c=='}'||c==']'||c=='\r'||c=='\n')break;e++;}return StringToDouble(StringSubstr(j,s,e-s));}
double JNumN(const string j,const string k){string p="\""+k+"\":";int i=StringFind(j,p);if(i<0)return -1;int s=i+StringLen(p);while(s<StringLen(j)&&StringGetCharacter(j,s)==' ')s++;if(StringSubstr(j,s,4)=="null")return -1;int e=s;while(e<StringLen(j)){ushort c=StringGetCharacter(j,e);if(c==','||c=='}'||c==']'||c=='\r'||c=='\n')break;e++;}return StringToDouble(StringSubstr(j,s,e-s));}
string JArr(const string j,const string k){string p="\""+k+"\":[";int i=StringFind(j,p);if(i<0)return "";int s=i+StringLen(p),depth=1,pos=s,len=StringLen(j);while(pos<len&&depth>0){ushort c=StringGetCharacter(j,pos);if(c=='[')depth++;else if(c==']')depth--;if(depth==0)return StringSubstr(j,s,pos-s);pos++;}return "";}
int SplitObjs(const string src,string &out[])
{
   int depth=0,pos=0,len=StringLen(src),start=-1,count=0;ArrayResize(out,0);
   while(pos<len){ushort c=StringGetCharacter(src,pos);if(c=='{'){depth++;if(depth==1)start=pos;}else if(c=='}'){depth--;if(depth==0&&start>=0){if(count<2000){ArrayResize(out,count+1);out[count++]=StringSubstr(src,start,pos-start+1);}start=-1;}}pos++;}
   return count;
}

bool FetchAndParse()
{
   string url=InpApiBase;StringTrimRight(url);
   if(StringSubstr(url,StringLen(url)-1,1)=="/")url=StringSubstr(url,0,StringLen(url)-1);
   url+="/api/community/copy-feed";

   string hdrs="Accept: application/json\r\nAuthorization: Bearer "+InpCopyToken+"\r\n";
   if(StringLen(g_etag)>0)hdrs+="If-None-Match: "+g_etag+"\r\n";

   uchar post[],result[];string rhdrs;ArrayResize(post,0);
   ResetLastError();
   int code=WebRequest("GET",url,hdrs,15000,post,result,rhdrs);

   if(code==-1){Log("WebRequest err="+IntegerToString(GetLastError())+". Izinkan "+InpApiBase);g_failCount++;return false;}
   if(code==304)return true;
   if(code==401){Log("Token tidak valid/kadaluarsa. Regenerasi di halaman Mengikuti.");g_failCount+=3;return false;}
   if(code==403){Log("Publisher nonaktifkan copy. Langganan tidak bisa dilanjutkan.");g_failCount+=3;return false;}
   if(code<200||code>=300){Log("HTTP "+IntegerToString(code));g_failCount++;return false;}

   g_failCount=0;
   int ep=StringFind(rhdrs,"ETag: ");
   if(ep>=0){int es=ep+6,ee=StringFind(rhdrs,"\r\n",es);if(ee<0)ee=StringLen(rhdrs);g_etag=StringSubstr(rhdrs,es,ee-es);StringTrimRight(g_etag);}

   string resp=CharArrayToString(result,0,WHOLE_ARRAY,CP_UTF8);
   if(StringFind(resp,"\"ok\":true")<0){Log("Resp tdk ok: "+StringSubstr(resp,0,100));return false;}

   string disp=JStr(resp,"displayName");
   if(StringLen(disp)>0&&disp!=g_pubLabel){g_pubLabel=disp;Log("Publisher: "+g_pubLabel);}

   string posContent=JArr(resp,"positions");
   g_posN=0;
   if(StringLen(posContent)==0)return true;

   string posObjs[];int nPos=SplitObjs("["+posContent+"]",posObjs);
   for(int i=0;i<nPos&&g_posN<2000;i++)
   {
      string o=posObjs[i];string tk=JStr(o,"ticket"),sym=JStr(o,"symbol");
      if(StringLen(tk)==0||StringLen(sym)==0||sym=="(internal)")continue;
      g_pos[g_posN].pubTicket=tk;g_pos[g_posN].symbol=sym;
      g_pos[g_posN].side=(int)JNum(o,"side");g_pos[g_posN].volume=JNum(o,"volume");
      double sl=JNumN(o,"sl"),tp=JNumN(o,"tp");
      g_pos[g_posN].sl=(sl>0)?sl:0;g_pos[g_posN].tp=(tp>0)?tp:0;
      g_posN++;
   }
   Log("Posisi publisher: "+IntegerToString(g_posN));
   return true;
}

void SyncPositions()
{
   if(InpCopyClose)
   {
      for(int i=OrdersTotal()-1;i>=0;i--)
      {
         if(!OrderSelect(i,SELECT_BY_POS,MODE_TRADES))continue;
         if(OrderMagicNumber()!=InpMagic)continue;if(OrderType()>1)continue;
         string cmt=OrderComment();if(!IsCopyCmt(cmt))continue;
         string pubTk=GetPubTk(cmt);bool found=false;
         for(int j=0;j<g_posN;j++)if(g_pos[j].pubTicket==pubTk){found=true;break;}
         if(!found)CloseLoc(OrderTicket());
      }
   }
   for(int i=0;i<g_posN;i++)
   {
      int tk=FindLocal(g_pos[i].pubTicket);
      if(tk<0)OpenPos(g_pos[i]);
      else    SyncSlTp(tk,g_pos[i]);
   }
}

void OnTick()
{
   if(TimeCurrent()<g_nextRun)return;
   g_nextRun=TimeCurrent()+MathMax(5,InpIntervalSec);
   if(StringLen(InpCopyToken)<16){if(!g_paused)Log("InpCopyToken belum diisi.");g_failCount++;return;}
   if(g_failCount>=10){if(!g_paused){Log("Terlalu banyak error, pause.");g_paused=true;}return;}
   if(FetchAndParse()){g_paused=false;SyncPositions();}
}

int OnInit(){Log("=== GMRFX CopyTrader MT4 v3 — magic="+IntegerToString(InpMagic)+" ===");if(StringLen(InpCopyToken)<16)Log("PERINGATAN: InpCopyToken belum diisi.");return INIT_SUCCEEDED;}
void OnDeinit(const int reason){Log("EA berhenti reason="+IntegerToString(reason));}
