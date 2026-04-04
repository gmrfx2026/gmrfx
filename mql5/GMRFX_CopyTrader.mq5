//+------------------------------------------------------------------+
//| GMRFX_CopyTrader.mq5                                             |
//| Copy trading dari akun komunitas GMR FX (MT5)                    |
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
#property version   "3.12"
#property description "Copy trading GMR FX. Isi InpCopyToken dari halaman Komunitas → Mengikuti."

#include <Trade\Trade.mqh>

//--- Input
input string  InpApiBase     = "https://gmrfx.app"; // URL API (tidak perlu diubah)
input string  InpCopyToken   = "";                   // Token copy dari halaman "Mengikuti"
input int     InpIntervalMs  = 2000;                 // Interval polling milidetik (min 1000 = 1 detik)
input int     InpMagic       = 20250401;             // Magic number unik per publisher

enum ENUM_VOL_MODE { VOL_FIXED=0, VOL_RATIO=1 };
input ENUM_VOL_MODE InpVolumeMode = VOL_FIXED; // 0=Lot tetap  1=Proporsional
input double  InpFixedLot    = 0.01; // Lot tetap (jika mode Fixed)
input double  InpRatio       = 1.0;  // Pengali volume (jika mode Ratio)

input bool    InpCopyClose   = true;  // Tutup posisi lokal jika publisher tutup
input bool    InpCopySL      = true;  // Sinkron StopLoss
input bool    InpCopyTP      = true;  // Sinkron TakeProfit
input bool    InpUseSuffix   = false; // Aktif jika broker pakai suffix simbol
input string  InpSuffix      = "";    // Suffix (mis. "m", ".r")
input double  InpSlippage    = 3.0;  // Slippage maks (poin)
input string  InpSymbolFilter = "";   // Filter simbol (koma, kosong=semua)

//--- State
CTrade g_trade;
int    g_failCount      = 0;
bool   g_paused         = false;
string g_etag           = "";
string g_publisherLabel = "";
bool   g_needSync       = false; // flag: ada perubahan lokal, poll segera

struct PubPos
{
   string pubTicket;
   string symbol;
   int    side;
   double volume;
   double sl;
   double tp;
};

PubPos g_pos[];
int    g_posN = 0;

//+------------------------------------------------------------------+
void Log(const string m) { Print("[GMRFX-Copy] ", m); }

// Komentar posisi: prefix + magic + ticket publisher (unik per EA instance)
string MakeCmt(const string pubTk)
{ return "GMRFX_CP_" + IntegerToString(InpMagic) + ":" + pubTk; }

bool IsCopyCmt(const string c)
{ return StringFind(c, "GMRFX_CP_" + IntegerToString(InpMagic) + ":") == 0; }

string GetPubTk(const string c)
{
   string pfx = "GMRFX_CP_" + IntegerToString(InpMagic) + ":";
   if(StringFind(c, pfx) == 0) return StringSubstr(c, StringLen(pfx));
   return "";
}

string LocalSym(const string s)
{
   if(!InpUseSuffix || StringLen(InpSuffix)==0) return s;
   // Cek versi suffix dulu — jika ada, prioritaskan
   string ws=s+InpSuffix;
   if(SymbolInfoInteger(ws,SYMBOL_EXIST)>0) return ws;
   if(SymbolInfoInteger(s,SYMBOL_EXIST)>0) return s;
   return s;
}

bool SymOk(const string sym)
{
   if(StringLen(InpSymbolFilter)==0) return true;
   string f[];
   int n=StringSplit(InpSymbolFilter,',',f);
   for(int i=0;i<n;i++)
   {
      StringTrimLeft(f[i]); StringTrimRight(f[i]);
      string fi=f[i]; StringToUpper(fi);
      string s=sym; StringToUpper(s);
      if(StringLen(fi)>0 && StringFind(s,fi)>=0) return true;
   }
   return false;
}

double CalcVol(const double pv,const string sym)
{
   // Pastikan simbol tersedia di Market Watch agar SymbolInfo mengembalikan data valid
   SymbolSelect(sym,true);
   double v=(InpVolumeMode==VOL_FIXED)?InpFixedLot:pv*MathMax(0.001,InpRatio);
   double step=SymbolInfoDouble(sym,SYMBOL_VOLUME_STEP);
   double mn=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN);
   double mx=SymbolInfoDouble(sym,SYMBOL_VOLUME_MAX);
   if(step<=0)step=0.01;
   if(mn<=0)mn=0.01;   // fallback: volume_min tidak terbaca (simbol belum di-subscribe)
   if(mx<=0)mx=100.0;  // fallback: volume_max tidak terbaca
   v=MathRound(v/step)*step;
   return NormalizeDouble(MathMax(mn,MathMin(mx,v)),2);
}

ulong FindLocal(const string pubTk)
{
   string cmt_target=MakeCmt(pubTk);
   for(int i=0;i<PositionsTotal();i++)
   {
      ulong tk=PositionGetTicket(i);
      if(tk==0) continue;
      if((long)PositionGetInteger(POSITION_MAGIC)!=InpMagic) continue;
      if(PositionGetString(POSITION_COMMENT)==cmt_target) return tk;
   }
   return 0;
}

// Deteksi filling type terbaik yang didukung broker untuk simbol tertentu
ENUM_ORDER_TYPE_FILLING BestFilling(const string sym)
{
   uint filling=(uint)SymbolInfoInteger(sym,SYMBOL_FILLING_FLAGS);
   if((filling & SYMBOL_FILLING_FOK)!=0) return ORDER_FILLING_FOK;
   if((filling & SYMBOL_FILLING_IOC)!=0) return ORDER_FILLING_IOC;
   return ORDER_FILLING_RETURN;
}

void OpenPos(const PubPos &p)
{
   string sym=LocalSym(p.symbol);
   if(!SymOk(sym)){Log("Skip filter: "+sym);return;}
   double vol=CalcVol(p.volume,sym);
   if(vol<=0){Log("Vol 0 skip "+sym);return;}
   int    dig=(int)SymbolInfoInteger(sym,SYMBOL_DIGITS);
   double sl=(InpCopySL&&p.sl>0)?NormalizeDouble(p.sl,dig):0;
   double tp=(InpCopyTP&&p.tp>0)?NormalizeDouble(p.tp,dig):0;
   g_trade.SetExpertMagicNumber(InpMagic);
   g_trade.SetDeviationInPoints((ulong)(InpSlippage/SymbolInfoDouble(sym,SYMBOL_POINT)));
   // Auto-deteksi filling type yang didukung broker untuk simbol ini
   g_trade.SetTypeFilling(BestFilling(sym));
   string cmt=MakeCmt(p.pubTicket);
   bool ok=(p.side==0)?g_trade.Buy(vol,sym,0,sl,tp,cmt):g_trade.Sell(vol,sym,0,sl,tp,cmt);
   if(ok) Log("BUKA "+(p.side==0?"BUY":"SELL")+" "+sym+" lot="+DoubleToString(vol,2)+" pub="+p.pubTicket);
   else   Log("GAGAL buka "+sym+" rc="+IntegerToString(g_trade.ResultRetcode()));
}

void CloseLoc(const ulong tk)
{
   if(!PositionSelectByTicket(tk)) return;
   string sym=PositionGetString(POSITION_SYMBOL);
   if(!g_trade.PositionClose(tk,(ulong)(InpSlippage/SymbolInfoDouble(sym,SYMBOL_POINT))))
      Log("GAGAL tutup "+IntegerToString((long)tk)+" rc="+IntegerToString(g_trade.ResultRetcode()));
   else Log("TUTUP "+IntegerToString((long)tk));
}

void SyncSlTp(const ulong tk,const PubPos &p)
{
   if(!PositionSelectByTicket(tk)) return;
   string sym=PositionGetString(POSITION_SYMBOL);
   int dig=(int)SymbolInfoInteger(sym,SYMBOL_DIGITS);
   double eps=SymbolInfoDouble(sym,SYMBOL_POINT)*2;
   double cSL=PositionGetDouble(POSITION_SL),cTP=PositionGetDouble(POSITION_TP);
   double nSL=(InpCopySL&&p.sl>0)?NormalizeDouble(p.sl,dig):cSL;
   double nTP=(InpCopyTP&&p.tp>0)?NormalizeDouble(p.tp,dig):cTP;
   if(MathAbs(nSL-cSL)<eps && MathAbs(nTP-cTP)<eps) return;
   g_trade.PositionModify(tk,nSL,nTP);
}

//+------------------------------------------------------------------+
//| JSON helpers                                                     |
//+------------------------------------------------------------------+
string JStr(const string j,const string k)
{
   string p="\""+k+"\":\""; int i=StringFind(j,p); if(i<0)return "";
   int s=i+StringLen(p),e=StringFind(j,"\"",s); if(e<s)return "";
   return StringSubstr(j,s,e-s);
}
double JNum(const string j,const string k)
{
   string p="\""+k+"\":"; int i=StringFind(j,p); if(i<0)return 0;
   int s=i+StringLen(p);
   while(s<StringLen(j)&&StringGetCharacter(j,s)==' ')s++;
   int e=s;
   while(e<StringLen(j)){ushort c=StringGetCharacter(j,e);if(c==','||c=='}'||c==']'||c=='\r'||c=='\n')break;e++;}
   return StringToDouble(StringSubstr(j,s,e-s));
}
double JNumN(const string j,const string k)
{
   string p="\""+k+"\":"; int i=StringFind(j,p); if(i<0)return -1;
   int s=i+StringLen(p);
   while(s<StringLen(j)&&StringGetCharacter(j,s)==' ')s++;
   if(StringSubstr(j,s,4)=="null")return -1;
   int e=s;
   while(e<StringLen(j)){ushort c=StringGetCharacter(j,e);if(c==','||c=='}'||c==']'||c=='\r'||c=='\n')break;e++;}
   return StringToDouble(StringSubstr(j,s,e-s));
}
string JArr(const string j,const string k)
{
   string p="\""+k+"\":["; int i=StringFind(j,p); if(i<0)return "";
   int s=i+StringLen(p),depth=1,pos=s,len=StringLen(j);
   while(pos<len&&depth>0){ushort c=StringGetCharacter(j,pos);if(c=='[')depth++;else if(c==']')depth--;if(depth==0)return StringSubstr(j,s,pos-s);pos++;}
   return "";
}
int SplitObjs(const string src,string &out[])
{
   int depth=0,pos=0,len=StringLen(src),start=-1,count=0;
   ArrayResize(out,0);
   while(pos<len){
      ushort c=StringGetCharacter(src,pos);
      if(c=='{'){depth++;if(depth==1)start=pos;}
      else if(c=='}'){depth--;if(depth==0&&start>=0){ArrayResize(out,count+1);out[count++]=StringSubstr(src,start,pos-start+1);start=-1;}}
      pos++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| Fetch dari /api/community/copy-feed                             |
//+------------------------------------------------------------------+
bool FetchAndParse()
{
   string url=InpApiBase;
   StringTrimRight(url);
   if(StringSubstr(url,StringLen(url)-1,1)=="/") url=StringSubstr(url,0,StringLen(url)-1);
   url+="/api/community/copy-feed";

   string hdrs="Accept: application/json\r\nAuthorization: Bearer "+InpCopyToken+"\r\n";
   if(StringLen(g_etag)>0) hdrs+="If-None-Match: "+g_etag+"\r\n";

   uchar post[],result[]; string rhdrs;
   ResetLastError();
   int code=WebRequest("GET",url,hdrs,15000,post,result,rhdrs);

   if(code==-1)
   {
      Log("WebRequest err="+IntegerToString(GetLastError())+". Izinkan "+InpApiBase+" di Tools→Options→Expert Advisors");
      g_failCount++;
      return false;
   }
   if(code==304) return true; // tidak ada perubahan

   if(code==401)
   {
      Log("Token tidak valid atau kadaluarsa. Cek InpCopyToken atau regenerasi di halaman Mengikuti.");
      g_failCount+=3;
      return false;
   }
   if(code==403)
   {
      Log("Publisher menonaktifkan layanan copy. Langganan copy tidak bisa dilanjutkan.");
      g_failCount+=3;
      return false;
   }
   if(code<200||code>=300){Log("HTTP "+IntegerToString(code));g_failCount++;return false;}

   g_failCount=0;

   // Simpan ETag
   int ep=StringFind(rhdrs,"ETag: ");
   if(ep>=0){int es=ep+6,ee=StringFind(rhdrs,"\r\n",es);if(ee<0)ee=StringLen(rhdrs);g_etag=StringSubstr(rhdrs,es,ee-es);StringTrimRight(g_etag);}

   string resp=CharArrayToString(result,0,WHOLE_ARRAY,CP_UTF8);
   if(StringFind(resp,"\"ok\":true")<0){Log("Resp tdk ok: "+StringSubstr(resp,0,100));return false;}

   // Ambil info publisher (untuk log)
   string disp=JStr(resp,"displayName");
   if(StringLen(disp)>0 && disp!=g_publisherLabel)
   {
      g_publisherLabel=disp;
      Log("Publisher: "+g_publisherLabel);
   }

   // Parse posisi
   string posContent=JArr(resp,"positions");
   g_posN=0; ArrayResize(g_pos,0);

   if(StringLen(posContent)==0) return true;

   string posObjs[];
   int nPos=SplitObjs("["+posContent+"]",posObjs);
   ArrayResize(g_pos,nPos);

   for(int i=0;i<nPos;i++)
   {
      string o=posObjs[i];
      string tk=JStr(o,"ticket"),sym=JStr(o,"symbol");
      if(StringLen(tk)==0||StringLen(sym)==0||sym=="(internal)") continue;
      g_pos[g_posN].pubTicket=tk;
      g_pos[g_posN].symbol=sym;
      g_pos[g_posN].side=(int)JNum(o,"side");
      g_pos[g_posN].volume=JNum(o,"volume");
      double sl=JNumN(o,"sl"),tp=JNumN(o,"tp");
      g_pos[g_posN].sl=(sl>0)?sl:0;
      g_pos[g_posN].tp=(tp>0)?tp:0;
      g_posN++;
   }
   ArrayResize(g_pos,g_posN);
   Log("Posisi publisher: "+IntegerToString(g_posN));
   return true;
}

//+------------------------------------------------------------------+
void SyncPositions()
{
   // Tutup posisi lokal yang hilang dari publisher
   if(InpCopyClose)
   {
      for(int i=PositionsTotal()-1;i>=0;i--)
      {
         ulong tk=PositionGetTicket(i);
         if(tk==0) continue;
         if((long)PositionGetInteger(POSITION_MAGIC)!=InpMagic) continue;
         string cmt=PositionGetString(POSITION_COMMENT);
         if(!IsCopyCmt(cmt)) continue;
         string pubTk=GetPubTk(cmt);
         bool found=false;
         for(int j=0;j<g_posN;j++)
            if(g_pos[j].pubTicket==pubTk){found=true;break;}
         if(!found) CloseLoc(tk);
      }
   }
   // Buka posisi baru / update SL/TP
   for(int i=0;i<g_posN;i++)
   {
      ulong tk=FindLocal(g_pos[i].pubTicket);
      if(tk==0) OpenPos(g_pos[i]);
      else      SyncSlTp(tk,g_pos[i]);
   }
}

//+------------------------------------------------------------------+
void DoSync()
{
   if(StringLen(InpCopyToken)<16)
   {
      if(!g_paused) Log("InpCopyToken belum diisi. Ambil dari halaman Komunitas → Mengikuti.");
      g_failCount++;
      return;
   }
   if(g_failCount>=10)
   {
      if(!g_paused){Log("Terlalu banyak error ("+IntegerToString(g_failCount)+"). Pause — restart EA.");g_paused=true;}
      return;
   }
   g_needSync = false;
   if(FetchAndParse()){g_paused=false;SyncPositions();}
}

void OnTimer()
{
   DoSync();
}

/**
 * OnTradeTransaction — dipanggil MT5 setiap kali ada perubahan posisi LOKAL.
 * Misalnya: posisi tertutup oleh SL/TP, atau ada margin call.
 * Dengan ini EA langsung tahu ada perubahan dan re-sync pada poll berikutnya.
 * Tidak langsung sync di sini untuk menghindari race condition.
 */
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest     &request,
                        const MqlTradeResult      &result)
{
   // Tandai perlu sync segera jika ada deal baru (posisi buka/tutup)
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD ||
      trans.type == TRADE_TRANSACTION_POSITION  )
   {
      // Hanya peduli posisi dengan magic EA ini
      if(trans.deal > 0)
      {
         ulong dealMagic = (ulong)HistoryDealGetInteger(trans.deal, DEAL_MAGIC);
         if(dealMagic == (ulong)InpMagic)
            g_needSync = true;
      }
   }
}

int OnInit()
{
   int ms = MathMax(1000, InpIntervalMs);
   EventSetMillisecondTimer(ms);
   Log("=== GMRFX CopyTrader MT5 v3.10 ===");
   Log("Poll    : "+IntegerToString(ms)+"ms | Magic: "+IntegerToString(InpMagic));
   Log("Vol     : "+(InpVolumeMode==VOL_FIXED?"Fixed "+DoubleToString(InpFixedLot,2):"Ratio x"+DoubleToString(InpRatio,3)));
   if(StringLen(InpCopyToken)<16) Log("PERINGATAN: InpCopyToken belum diisi.");
   else DoSync();
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason){EventKillTimer();Log("EA berhenti reason="+IntegerToString(reason));}
void OnTick()
{
   // Jika ada flag needSync (dari OnTradeTransaction), percepat sync
   if(g_needSync) DoSync();
}
