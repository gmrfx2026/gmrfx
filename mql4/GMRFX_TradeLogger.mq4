//+------------------------------------------------------------------+
//| GMRFX_TradeLogger.mq4                                             |
//| MetaTrader 4 — kirim order historis (tutup) + snapshot ke GMR FX   |
//| Token: Profil → Portofolio → Ringkasan (sama seperti MT5)         |
//| Endpoint: POST .../api/mt4/ingest (alias ke pipeline MT5)         |
//+------------------------------------------------------------------+
#property copyright "GMR FX"
#property link      "https://github.com/"
#property version   "1.05"
#property strict

//--- MT4: satu baris histori = satu posisi market yang sudah ditutup.
//--- Dipetakan ke "deal" penutupan: entryType=1 (OUT), dealTime=waktu tutup.

input string InpApiBase     = "https://your-domain.com"; // tanpa slash akhir
input string InpApiToken    = "";                        // Bearer dari dashboard
input int    InpIntervalSec = 300;                        // min 60
input int    InpHistoryDays = 14;                         // hari ke belakang (OrderCloseTime)

#define GMRFX_MAX_ROWS 2500

string JsonEscapeSym(string s)
{
   StringReplace(s, "\\", "");
   StringReplace(s, "\"", "'");
   return s;
}

string JsonEscapeCmt(string s)
{
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "'");
   StringReplace(s, "\r", " ");
   StringReplace(s, "\n", " ");
   return s;
}

string GmrfxMt4OpenPositionsJson()
{
   string out;
   bool   first;
   int    n;
   int    i;
   int    typ;
   string sym;
   double vol;
   double priceOpen;
   double priceCur;
   double sl;
   double tp;
   double profit;
   double swap;
   double comm;
   double point;
   double pts;
   int    tkt;
   string tks;

   out = "[";
   first = true;
   n = OrdersTotal();
   for(i = 0; i < n; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      typ = OrderType();
      if(typ != OP_BUY && typ != OP_SELL)
         continue;

      sym = OrderSymbol();
      StringTrimLeft(sym);
      StringTrimRight(sym);
      if(StringLen(sym) == 0)
         sym = "(internal)";
      sym = JsonEscapeSym(sym);

      tkt = OrderTicket();
      tks = IntegerToString(tkt);
      vol = OrderLots();
      priceOpen = OrderOpenPrice();
      sl = OrderStopLoss();
      tp = OrderTakeProfit();
      profit = OrderProfit();
      swap = OrderSwap();
      comm = OrderCommission();
      point = MarketInfo(sym, MODE_POINT);
      if(point <= 0.0)
         point = Point;
      if(typ == OP_BUY)
      {
         priceCur = MarketInfo(sym, MODE_BID);
         pts = (priceCur - priceOpen) / point;
      }
      else
      {
         priceCur = MarketInfo(sym, MODE_ASK);
         pts = (priceOpen - priceCur) / point;
      }

      if(!first)
         out += ",";
      first = false;

      out += "{";
      out += "\"ticket\":\"" + tks + "\",";
      out += "\"symbol\":\"" + sym + "\",";
      out += "\"side\":" + IntegerToString(typ) + ",";
      out += "\"volume\":" + DoubleToString(vol, 8) + ",";
      out += "\"priceOpen\":" + DoubleToString(priceOpen, 8) + ",";
      out += "\"priceCurrent\":" + DoubleToString(priceCur, 8) + ",";
      out += "\"sl\":";
      if(sl > 0.0)
         out += DoubleToString(sl, 8);
      else
         out += "null";
      out += ",\"tp\":";
      if(tp > 0.0)
         out += DoubleToString(tp, 8);
      else
         out += "null";
      out += ",\"profit\":" + DoubleToString(profit, 8);
      out += ",\"swap\":" + DoubleToString(swap, 8);
      out += ",\"commission\":" + DoubleToString(comm, 8);
      out += ",\"openTime\":" + IntegerToString((int)OrderOpenTime());
      out += ",\"points\":" + DoubleToString(pts, 2);
      out += "}";
   }
   out += "]";
   return out;
}

string GmrfxMt4PendingOrdersJson()
{
   string out;
   bool   first;
   int    n;
   int    i;
   int    typ;
   string sym;
   double vol;
   double price;
   double sl;
   double tp;
   int    tkt;
   string tks;

   out = "[";
   first = true;
   n = OrdersTotal();
   for(i = 0; i < n; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      typ = OrderType();
      if(typ == OP_BUY || typ == OP_SELL)
         continue;

      sym = OrderSymbol();
      StringTrimLeft(sym);
      StringTrimRight(sym);
      if(StringLen(sym) == 0)
         sym = "(internal)";
      sym = JsonEscapeSym(sym);

      tkt = OrderTicket();
      tks = IntegerToString(tkt);
      vol = OrderLots();
      price = OrderOpenPrice();
      sl = OrderStopLoss();
      tp = OrderTakeProfit();

      if(!first)
         out += ",";
      first = false;

      out += "{";
      out += "\"ticket\":\"" + tks + "\",";
      out += "\"symbol\":\"" + sym + "\",";
      out += "\"orderType\":" + IntegerToString(typ) + ",";
      out += "\"volume\":" + DoubleToString(vol, 8) + ",";
      out += "\"priceOrder\":" + DoubleToString(price, 8) + ",";
      out += "\"sl\":";
      if(sl > 0.0)
         out += DoubleToString(sl, 8);
      else
         out += "null";
      out += ",\"tp\":";
      if(tp > 0.0)
         out += DoubleToString(tp, 8);
      else
         out += "null";
      out += ",\"setupTime\":" + IntegerToString((int)OrderOpenTime());
      out += "}";
   }
   out += "]";
   return out;
}

string BuildJsonBody()
{
   long   login;
   double bal, eq, mg;
   string json;
   datetime fromTime;
   datetime toTime;
   int    total;
   int    i;
   int    sent;
   bool   first;
   int    typ;
   datetime ct;
   datetime ot;
   string sym;
   string cmt;
   string cur;
   string brk;
   string srv;
   string accName;
   double vol;
   double price;
   double comm;
   double swap;
   double prof;
   int    magic;
   int    ticket;
   string tks;

   login = (long)AccountNumber();
   bal   = AccountBalance();
   eq    = AccountEquity();
   mg    = AccountMargin();
   cur = AccountCurrency();
   StringTrimLeft(cur);
   StringTrimRight(cur);
   cur = JsonEscapeSym(cur);
   brk = AccountCompany();
   StringTrimLeft(brk);
   StringTrimRight(brk);
   brk = JsonEscapeSym(brk);
   srv = AccountServer();
   StringTrimLeft(srv);
   StringTrimRight(srv);
   srv = JsonEscapeSym(srv);
   accName = AccountName();
   StringTrimLeft(accName);
   StringTrimRight(accName);
   accName = JsonEscapeSym(accName);

   json = "{";
   json += "\"login\":" + IntegerToString((int)login) + ",";
   json += "\"platform\":\"mt4\",";
   json += "\"account\":{";
   json += "\"balance\":" + DoubleToString(bal, 8) + ",";
   json += "\"equity\":" + DoubleToString(eq, 8) + ",";
   json += "\"margin\":" + DoubleToString(mg, 8) + ",";
   json += "\"currency\":\"" + cur + "\",";
   json += "\"brokerName\":\"" + brk + "\",";
   json += "\"brokerServer\":\"" + srv + "\",";
   json += "\"tradeAccountName\":\"" + accName + "\"";
   json += "},";
   json += "\"deals\":[";

   fromTime = TimeCurrent() - (datetime)(MathMax(1, InpHistoryDays) * 86400);
   toTime   = TimeCurrent() + 60;

   total = OrdersHistoryTotal();
   sent  = 0;
   first = true;

   for(i = 0; i < total && sent < GMRFX_MAX_ROWS; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
         continue;

      typ = OrderType();
      if(typ != OP_BUY && typ != OP_SELL)
         continue;

      ct = OrderCloseTime();
      if(ct <= 0 || ct < fromTime || ct > toTime)
         continue;

      ticket = OrderTicket();
      tks    = IntegerToString(ticket);
      sym    = OrderSymbol();
      StringTrimLeft(sym);
      StringTrimRight(sym);
      if(StringLen(sym) == 0)
         sym = "(internal)";
      sym = JsonEscapeSym(sym);

      vol   = OrderLots();
      price = OrderClosePrice();
      comm  = OrderCommission();
      swap  = OrderSwap();
      prof  = OrderProfit();
      magic = (int)OrderMagicNumber();
      cmt   = OrderComment();
      cmt   = JsonEscapeCmt(cmt);
      ot    = OrderOpenTime();

      if(!first)
         json += ",";
      first = false;

      json += "{";
      json += "\"ticket\":\"" + tks + "\",";
      json += "\"dealTime\":" + IntegerToString((int)ct) + ",";
      json += "\"symbol\":\"" + sym + "\",";
      json += "\"dealType\":" + IntegerToString(typ) + ",";
      // 1 = OUT (penutupan), konsisten dengan filter server MT5
      json += "\"entryType\":1,";
      json += "\"volume\":" + DoubleToString(vol, 8) + ",";
      json += "\"price\":" + DoubleToString(price, 8) + ",";
      json += "\"commission\":" + DoubleToString(comm, 8) + ",";
      json += "\"swap\":" + DoubleToString(swap, 8) + ",";
      json += "\"profit\":" + DoubleToString(prof, 8) + ",";
      json += "\"magic\":" + IntegerToString(magic) + ",";
      json += "\"comment\":\"" + cmt + "\"";
      // MT4: satu ticket = satu posisi market; buka ↔ tutup pada order yang sama
      json += ",\"positionId\":\"" + tks + "\"";
      if(ot > 0)
         json += ",\"positionOpenTime\":" + IntegerToString((int)ot);
      json += "}";

      sent++;
   }

   json += "]";
   json += ",\"openPositions\":";
   json += GmrfxMt4OpenPositionsJson();
   json += ",\"pendingOrders\":";
   json += GmrfxMt4PendingOrdersJson();
   json += "}";
   return json;
}

bool PostToServer(const string json_body, string &response)
{
   string url;
   string headers;
   uchar  post[];
   uchar  result[];
   string result_headers;
   int    conv;
   int    timeout;
   int    code;
   int    err;

   url = InpApiBase;
   if(StringSubstr(url, StringLen(url) - 1, 1) == "/")
      url = StringSubstr(url, 0, StringLen(url) - 1);
   url += "/api/mt4/ingest";

   headers = "Content-Type: application/json; charset=utf-8\r\n";
   headers += "Authorization: Bearer " + InpApiToken + "\r\n";

   conv = StringToCharArray(json_body, post, 0, WHOLE_ARRAY, CP_UTF8);
   if(conv < 2)
   {
      Print("GMRFX MT4: gagal konversi JSON ke UTF-8");
      return false;
   }
   ArrayResize(post, conv - 1);

   timeout = 30000;
   ResetLastError();
   code = WebRequest("POST", url, headers, timeout, post, result, result_headers);
   if(code == -1)
   {
      err = GetLastError();
      Print("GMRFX MT4: WebRequest gagal, err=", err,
            " — tambahkan URL ", url, " di Tools → Options → Expert Advisors → Allow WebRequest");
      return false;
   }

   response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   Print("GMRFX MT4: HTTP ", code, " ", StringSubstr(response, 0, 200));
   return (code >= 200 && code < 300);
}

void OnTimer()
{
   string body;
   string resp;

   if(StringLen(InpApiToken) < 16)
   {
      Print("GMRFX MT4: isi InpApiToken (dari dashboard web)");
      return;
   }

   body = BuildJsonBody();
   PostToServer(body, resp);
}

int OnInit()
{
   int sec;
   sec = MathMax(60, InpIntervalSec);
   EventSetTimer(sec);
   Print("GMRFX Trade Logger MT4 aktif, interval ", sec, "s → /api/mt4/ingest");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTick()
{
}
