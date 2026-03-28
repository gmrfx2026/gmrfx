//+------------------------------------------------------------------+
//| GMRFX_TradeLogger.mq5                                             |
//| Kirim deal historis + snapshot akun ke API GMR FX                 |
//| Pasang token dari: Profil → Portofolio → Ringkasan               |
//+------------------------------------------------------------------+
#property copyright "GMR FX"
#property link      "https://github.com/"
#property version   "1.01"
#property strict

ulong  g_gmrfx_pos_ids[];
long   g_gmrfx_pos_times[];
int    g_gmrfx_pos_n = 0;

void GmrfxPosClear()
{
   g_gmrfx_pos_n = 0;
   ArrayResize(g_gmrfx_pos_ids, 0);
   ArrayResize(g_gmrfx_pos_times, 0);
}

void GmrfxPosRemember(const ulong pid, const long t)
{
   if(pid == 0)
      return;
   for(int j = 0; j < g_gmrfx_pos_n; j++)
   {
      if(g_gmrfx_pos_ids[j] == pid)
         return;
   }
   int n = g_gmrfx_pos_n + 1;
   ArrayResize(g_gmrfx_pos_ids, n);
   ArrayResize(g_gmrfx_pos_times, n);
   g_gmrfx_pos_ids[g_gmrfx_pos_n] = pid;
   g_gmrfx_pos_times[g_gmrfx_pos_n] = t;
   g_gmrfx_pos_n++;
}

long GmrfxPosOpenTime(const ulong pid)
{
   if(pid == 0)
      return 0;
   for(int j = 0; j < g_gmrfx_pos_n; j++)
   {
      if(g_gmrfx_pos_ids[j] == pid)
         return g_gmrfx_pos_times[j];
   }
   return 0;
}

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

   GmrfxPosClear();
   int nDeals = ok ? HistoryDealsTotal() : 0;

   if(ok && nDeals > 0)
   {
      for(int i = 0; i < nDeals; i++)
      {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket == 0)
            continue;
         int dtype0 = (int)HistoryDealGetInteger(ticket, DEAL_TYPE);
         int entry0 = (int)HistoryDealGetInteger(ticket, DEAL_ENTRY);
         if(dtype0 > 1)
            continue;
         if(entry0 != DEAL_ENTRY_IN)
            continue;
         ulong pid0 = (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
         long t0 = (long)HistoryDealGetInteger(ticket, DEAL_TIME);
         GmrfxPosRemember(pid0, t0);
      }
   }

   bool first = true;
   if(ok && nDeals > 0)
   {
      for(int i = 0; i < nDeals; i++)
      {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket == 0)
            continue;

         long dealTime = (long)HistoryDealGetInteger(ticket, DEAL_TIME); // detik Unix
         string sym = HistoryDealGetString(ticket, DEAL_SYMBOL);
         StringTrimLeft(sym);
         StringTrimRight(sym);
         if(StringLen(sym) == 0)
            sym = "(internal)";
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
         ulong pos_id = (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
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
         if(pos_id > 0)
         {
            json += ",\"positionId\":\"" + StringFormat("%I64u", pos_id) + "\"";
            if((dtype <= 1) && (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY))
            {
               long ot = GmrfxPosOpenTime(pos_id);
               if(ot > 0)
                  json += ",\"positionOpenTime\":" + StringFormat("%I64d", ot);
            }
         }
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
