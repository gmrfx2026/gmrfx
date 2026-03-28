//+------------------------------------------------------------------+
//| GMRFX_TradeLogger.mq5                                             |
//| Kirim deal historis + snapshot akun ke API GMR FX                 |
//| Pasang token dari: Profil → Portofolio → Ringkasan               |
//+------------------------------------------------------------------+
#property copyright "GMR FX"
#property link      "https://github.com/"
#property version   "1.00"
#property strict

input string InpApiBase    = "https://your-domain.com"; // URL situs (tanpa slash akhir)
input string InpApiToken   = "";                        // Token dari dashboard (Bearer)
input int    InpIntervalSec = 300;                       // Interval sinkron (detik), min 60
input int    InpHistoryDays = 14;                        // Riwayat deal (hari ke belakang)

string BuildJsonBody()
{
   long login = (long)AccountInfoInteger(ACCOUNT_LOGIN);
   double bal = AccountInfoDouble(ACCOUNT_BALANCE);
   double eq  = AccountInfoDouble(ACCOUNT_EQUITY);
   double mg  = AccountInfoDouble(ACCOUNT_MARGIN);

   string json = "{";
   json += "\"login\":" + IntegerToString(login) + ",";
   json += "\"account\":{";
   json += "\"balance\":" + DoubleToString(bal, 8) + ",";
   json += "\"equity\":" + DoubleToString(eq, 8) + ",";
   json += "\"margin\":" + DoubleToString(mg, 8);
   json += "},";
   json += "\"deals\":[";

   datetime from = TimeCurrent() - (datetime)(MathMax(1, InpHistoryDays) * 86400);
   datetime to   = TimeCurrent() + 120;
   bool ok = HistorySelect(from, to);

   bool first = true;
   if(ok)
   {
      int n = HistoryDealsTotal();
      for(int i = 0; i < n; i++)
      {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket == 0)
            continue;

         long dealTime = (long)HistoryDealGetInteger(ticket, DEAL_TIME); // detik Unix
         string sym = HistoryDealGetString(ticket, DEAL_SYMBOL);
         StringReplace(sym, "\\", "");
         StringReplace(sym, "\"", "'");

         int dtype = (int)HistoryDealGetInteger(ticket, DEAL_TYPE);
         int entry = (int)HistoryDealGetInteger(ticket, DEAL_ENTRY);
         double vol = HistoryDealGetDouble(ticket, DEAL_VOLUME);
         double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
         double comm = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
         double prof = HistoryDealGetDouble(ticket, DEAL_PROFIT);
         int magic = (int)HistoryDealGetInteger(ticket, DEAL_MAGIC);
         string cmt = HistoryDealGetString(ticket, DEAL_COMMENT);
         StringReplace(cmt, "\\", "\\\\");
         StringReplace(cmt, "\"", "'");
         StringReplace(cmt, "\r", " ");
         StringReplace(cmt, "\n", " ");

         if(!first)
            json += ",";
         first = false;

         json += "{";
         json += "\"ticket\":\"" + StringFormat("%I64u", ticket) + "\",";
         json += "\"dealTime\":" + StringFormat("%I64d", dealTime) + ",";
         json += "\"symbol\":\"" + sym + "\",";
         json += "\"dealType\":" + IntegerToString(dtype) + ",";
         json += "\"entryType\":" + IntegerToString(entry) + ",";
         json += "\"volume\":" + DoubleToString(vol, 8) + ",";
         json += "\"price\":" + DoubleToString(price, 8) + ",";
         json += "\"commission\":" + DoubleToString(comm, 8) + ",";
         json += "\"swap\":" + DoubleToString(swap, 8) + ",";
         json += "\"profit\":" + DoubleToString(prof, 8) + ",";
         json += "\"magic\":" + IntegerToString(magic) + ",";
         json += "\"comment\":\"" + cmt + "\"";
         json += "}";
      }
   }

   json += "]}";
   return json;
}

bool PostToServer(const string json_body, string &response)
{
   string url = InpApiBase;
   if(StringSubstr(url, StringLen(url) - 1, 1) == "/")
      url = StringSubstr(url, 0, StringLen(url) - 1);
   url += "/api/mt5/ingest";

   string headers = "Content-Type: application/json; charset=utf-8\r\n";
   headers += "Authorization: Bearer " + InpApiToken + "\r\n";

   uchar post[];
   uchar result[];
   string result_headers;

   int conv = StringToCharArray(json_body, post, 0, WHOLE_ARRAY, CP_UTF8);
   if(conv < 2)
   {
      Print("GMRFX: gagal konversi JSON ke UTF-8");
      return false;
   }
   ArrayResize(post, conv - 1);

   int timeout = 30000;
   ResetLastError();
   int code = WebRequest("POST", url, headers, timeout, post, result, result_headers);
   if(code == -1)
   {
      int err = GetLastError();
      Print("GMRFX: WebRequest gagal, err=", err, " — pastikan URL ada di Tools → Options → Expert Advisors → Allow WebRequest for listed URL");
      return false;
   }

   response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   Print("GMRFX: HTTP ", code, " ", StringSubstr(response, 0, 200));
   return (code >= 200 && code < 300);
}

void OnTimer()
{
   if(StringLen(InpApiToken) < 16)
   {
      Print("GMRFX: isi InpApiToken (dari dashboard)");
      return;
   }

   string body = BuildJsonBody();
   string resp;
   PostToServer(body, resp);
}

int OnInit()
{
   int sec = MathMax(60, InpIntervalSec);
   EventSetTimer(sec);
   Print("GMRFX Trade Logger aktif, interval ", sec, "s");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTick()
{
}

void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
}
