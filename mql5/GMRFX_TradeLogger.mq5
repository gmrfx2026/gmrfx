//+------------------------------------------------------------------+
//| GMRFX_TradeLogger.mq5                                             |
//| Kirim deal historis + snapshot akun ke API GMR FX                 |
//| Pasang token dari: Profil → Portofolio → Ringkasan               |
//+------------------------------------------------------------------+
#property copyright "GMR FX"
#property link      "https://github.com/"
#property version   "1.09"
#property strict

// Basis URL API (tanpa slash akhir).
#define GMRFX_API_BASE "https://gmrfx.app"

// Throttle OnTrade: kirim paling cepat setiap N detik agar tidak spam API.
#define GMRFX_TRADE_THROTTLE_SEC 5

// Timeout HTTP: lebih pendek untuk kirim cepat OnTrade, penuh untuk timer.
#define GMRFX_TIMEOUT_FAST_MS  8000
#define GMRFX_TIMEOUT_FULL_MS 30000

ulong  g_gmrfx_pos_ids[];
long   g_gmrfx_pos_times[];
int    g_gmrfx_pos_n = 0;
datetime g_lastSendTime = 0;

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

input string InpApiToken   = "";                        // Token dari dashboard (Bearer)
input int    InpIntervalSec = 300;                       // Interval sinkron (detik), min 60
input int    InpHistoryDays = 14;                        // Riwayat deal (hari ke belakang)

string GmrfxJsonEscape(const string s)
{
   string o = s;
   StringTrimLeft(o);
   StringTrimRight(o);
   StringReplace(o, "\\", "");
   StringReplace(o, "\"", "'");
   StringReplace(o, "\r", " ");
   StringReplace(o, "\n", " ");
   return o;
}

// Komisi posisi: POSITION_COMMISSION sudah deprecated/dihapus dari enum — jumlahkan DEAL_COMMISSION di histori posisi.
double GmrfxCommissionForPositionId(const ulong position_identifier)
{
   if(position_identifier == 0)
      return 0.0;
   if(!HistorySelectByPosition(position_identifier))
      return 0.0;
   double sum = 0.0;
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0)
         continue;
      sum += HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
   }
   return sum;
}

// Posisi terbuka (PositionsTotal / PositionSelectByTicket — API MQL5).
string GmrfxOpenPositionsJson()
{
   string out = "[";
   bool first = true;
   int n = PositionsTotal();
   for(int i = 0; i < n; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;
      if(!PositionSelectByTicket(ticket))
         continue;

      string symRaw = PositionGetString(POSITION_SYMBOL);
      StringTrimLeft(symRaw);
      StringTrimRight(symRaw);
      if(StringLen(symRaw) == 0)
         symRaw = "(internal)";
      string symJson = GmrfxJsonEscape(symRaw);
      long ptype = (long)PositionGetInteger(POSITION_TYPE);
      double vol = PositionGetDouble(POSITION_VOLUME);
      double priceOpen = PositionGetDouble(POSITION_PRICE_OPEN);
      double priceCur = PositionGetDouble(POSITION_PRICE_CURRENT);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      double profit = PositionGetDouble(POSITION_PROFIT);
      double swap = PositionGetDouble(POSITION_SWAP);
      ulong posIdentifier = (ulong)PositionGetInteger(POSITION_IDENTIFIER);
      // Samakan dengan DEAL_POSITION_ID di deal penutupan (HistoryDealInteger DEAL_POSITION_ID).
      ulong idForApi = (posIdentifier > 0 ? posIdentifier : ticket);
      double comm = GmrfxCommissionForPositionId(posIdentifier);
      long openTime = (long)PositionGetInteger(POSITION_TIME);

      double point = SymbolInfoDouble(symRaw, SYMBOL_POINT);
      if(point <= 0.0)
         point = _Point;
      double pts = 0.0;
      if(ptype == POSITION_TYPE_BUY)
         pts = (priceCur - priceOpen) / point;
      else if(ptype == POSITION_TYPE_SELL)
         pts = (priceOpen - priceCur) / point;

      if(!first)
         out += ",";
      first = false;

      out += "{";
      out += "\"ticket\":\"" + StringFormat("%I64u", idForApi) + "\",";
      out += "\"symbol\":\"" + symJson + "\",";
      out += "\"side\":" + IntegerToString((int)ptype) + ",";
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
      out += ",\"openTime\":" + StringFormat("%I64d", openTime);
      out += ",\"points\":" + DoubleToString(pts, 2);
      out += "}";
   }
   out += "]";
   return out;
}

// Order tertunda — MQL5: OrderGetTicket(i) + OrderSelect(ticket), bukan sintaks MQL4.
string GmrfxPendingOrdersJson()
{
   string out = "[";
   bool first = true;
   int m = OrdersTotal();
   for(int j = 0; j < m; j++)
   {
      ulong ticket = OrderGetTicket(j);
      if(ticket == 0)
         continue;
      if(!OrderSelect(ticket))
         continue;
      ENUM_ORDER_TYPE otype = (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);
      if(otype == ORDER_TYPE_BUY || otype == ORDER_TYPE_SELL)
         continue;
      string symRaw = OrderGetString(ORDER_SYMBOL);
      StringTrimLeft(symRaw);
      StringTrimRight(symRaw);
      if(StringLen(symRaw) == 0)
         symRaw = "(internal)";
      string symJson = GmrfxJsonEscape(symRaw);
      double vol = OrderGetDouble(ORDER_VOLUME_INITIAL);
      double price = OrderGetDouble(ORDER_PRICE_OPEN);
      double sl = OrderGetDouble(ORDER_SL);
      double tp = OrderGetDouble(ORDER_TP);
      long setup = (long)OrderGetInteger(ORDER_TIME_SETUP);

      if(!first)
         out += ",";
      first = false;

      out += "{";
      out += "\"ticket\":\"" + StringFormat("%I64u", ticket) + "\",";
      out += "\"symbol\":\"" + symJson + "\",";
      out += "\"orderType\":" + IntegerToString((int)otype) + ",";
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
      out += ",\"setupTime\":" + StringFormat("%I64d", setup);
      out += "}";
   }
   out += "]";
   return out;
}

string BuildJsonBody()
{
   long login = (long)AccountInfoInteger(ACCOUNT_LOGIN);
   double bal = AccountInfoDouble(ACCOUNT_BALANCE);
   double eq  = AccountInfoDouble(ACCOUNT_EQUITY);
   double mg  = AccountInfoDouble(ACCOUNT_MARGIN);
   string cur = AccountInfoString(ACCOUNT_CURRENCY);
   StringTrimLeft(cur);
   StringTrimRight(cur);
   StringReplace(cur, "\\", "");
   StringReplace(cur, "\"", "'");
   string brk = AccountInfoString(ACCOUNT_COMPANY);
   StringTrimLeft(brk);
   StringTrimRight(brk);
   StringReplace(brk, "\\", "");
   StringReplace(brk, "\"", "'");
   StringReplace(brk, "\r", " ");
   StringReplace(brk, "\n", " ");
   string srv = AccountInfoString(ACCOUNT_SERVER);
   StringTrimLeft(srv);
   StringTrimRight(srv);
   StringReplace(srv, "\\", "");
   StringReplace(srv, "\"", "'");
   StringReplace(srv, "\r", " ");
   StringReplace(srv, "\n", " ");
   string accName = AccountInfoString(ACCOUNT_NAME);
   StringTrimLeft(accName);
   StringTrimRight(accName);
   StringReplace(accName, "\\", "");
   StringReplace(accName, "\"", "'");
   StringReplace(accName, "\r", " ");
   StringReplace(accName, "\n", " ");

   string json = "{";
   json += "\"login\":" + IntegerToString(login) + ",";
   json += "\"platform\":\"mt5\",";
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
         int dreason = (int)HistoryDealGetInteger(ticket, DEAL_REASON);
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
         json += "\"dealReason\":" + IntegerToString(dreason) + ",";
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

   json += "]";
   json += ",\"openPositions\":";
   json += GmrfxOpenPositionsJson();
   json += ",\"pendingOrders\":";
   json += GmrfxPendingOrdersJson();
   json += "}";
   return json;
}

/**
 * Payload ringan: hanya open positions + account snapshot, tanpa HistorySelect.
 * Digunakan oleh OnTrade() agar pengiriman instan tanpa scan deal historis.
 * Server tetap update MtTradingActivity.openPositions dengan benar.
 */
string BuildFastBody()
{
   long login = (long)AccountInfoInteger(ACCOUNT_LOGIN);
   double bal = AccountInfoDouble(ACCOUNT_BALANCE);
   double eq  = AccountInfoDouble(ACCOUNT_EQUITY);
   double mg  = AccountInfoDouble(ACCOUNT_MARGIN);
   string cur = AccountInfoString(ACCOUNT_CURRENCY);
   StringTrimLeft(cur); StringTrimRight(cur);
   StringReplace(cur, "\\", ""); StringReplace(cur, "\"", "'");
   string brk = AccountInfoString(ACCOUNT_COMPANY);
   StringTrimLeft(brk); StringTrimRight(brk);
   StringReplace(brk, "\\", ""); StringReplace(brk, "\"", "'");
   StringReplace(brk, "\r", " "); StringReplace(brk, "\n", " ");
   string srv = AccountInfoString(ACCOUNT_SERVER);
   StringTrimLeft(srv); StringTrimRight(srv);
   StringReplace(srv, "\\", ""); StringReplace(srv, "\"", "'");
   string accName = AccountInfoString(ACCOUNT_NAME);
   StringTrimLeft(accName); StringTrimRight(accName);
   StringReplace(accName, "\\", ""); StringReplace(accName, "\"", "'");
   StringReplace(accName, "\r", " "); StringReplace(accName, "\n", " ");

   string json = "{";
   json += "\"login\":" + IntegerToString(login) + ",";
   json += "\"platform\":\"mt5\",";
   json += "\"account\":{";
   json += "\"balance\":" + DoubleToString(bal, 8) + ",";
   json += "\"equity\":" + DoubleToString(eq, 8) + ",";
   json += "\"margin\":" + DoubleToString(mg, 8) + ",";
   json += "\"currency\":\"" + cur + "\",";
   json += "\"brokerName\":\"" + brk + "\",";
   json += "\"brokerServer\":\"" + srv + "\",";
   json += "\"tradeAccountName\":\"" + accName + "\"";
   json += "},";
   // deals kosong — server hanya update openPositions (tidak sentuh riwayat deal)
   json += "\"deals\":[],";
   json += "\"openPositions\":";
   json += GmrfxOpenPositionsJson();
   json += ",\"pendingOrders\":";
   json += GmrfxPendingOrdersJson();
   json += "}";
   return json;
}

bool PostToServer(const string json_body, string &response, const int timeout_ms)
{
   string url = GMRFX_API_BASE;
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

   ResetLastError();
   int code = WebRequest("POST", url, headers, timeout_ms, post, result, result_headers);
   if(code == -1)
   {
      int err = GetLastError();
      Print("GMRFX: WebRequest gagal, err=", err, " — pastikan URL ada di Tools → Options → Expert Advisors → Allow WebRequest for listed URL");
      return false;
   }

   response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   Print("GMRFX: HTTP ", code, " [", (timeout_ms < 15000 ? "fast" : "full"), "] ", StringSubstr(response, 0, 120));
   return (code >= 200 && code < 300);
}

/**
 * Kirim penuh: deals historis + open positions.
 * Dipakai oleh OnTimer() — backup sync berkala.
 */
void TrySendFull(const string reason)
{
   if(StringLen(InpApiToken) < 16)
   {
      Print("GMRFX: isi InpApiToken (dari dashboard)");
      return;
   }
   string body = BuildJsonBody();
   string resp;
   bool ok = PostToServer(body, resp, GMRFX_TIMEOUT_FULL_MS);
   if(ok)
   {
      g_lastSendTime = TimeCurrent();
      Print("GMRFX: sinkron full [", reason, "] OK");
   }
}

/**
 * Kirim cepat: HANYA open positions, tanpa scan deal historis.
 * Dipakai oleh OnTrade() — reaksi instan saat posisi buka/tutup.
 * Payload jauh lebih kecil & proses server lebih ringan.
 */
void TrySendFast(const string reason)
{
   if(StringLen(InpApiToken) < 16) return;
   string body = BuildFastBody();
   string resp;
   bool ok = PostToServer(body, resp, GMRFX_TIMEOUT_FAST_MS);
   if(ok)
   {
      g_lastSendTime = TimeCurrent();
      Print("GMRFX: sinkron fast [", reason, "] OK");
   }
}

void OnTimer()
{
   TrySendFull("timer");
}

/**
 * OnTrade — dipanggil MT5 setiap kali ada perubahan trading:
 * posisi buka, tutup, atau order tereksekusi.
 * Gunakan payload ringan (tanpa HistorySelect) agar instan.
 */
void OnTrade()
{
   datetime now = TimeCurrent();
   if(now - g_lastSendTime < GMRFX_TRADE_THROTTLE_SEC) return;
   TrySendFast("OnTrade");
}

int OnInit()
{
   int sec = MathMax(60, InpIntervalSec);
   EventSetTimer(sec);
   Print("GMRFX Trade Logger aktif | interval=", sec, "s | OnTrade fast-throttle=", GMRFX_TRADE_THROTTLE_SEC, "s");
   // Kirim langsung saat EA pertama kali aktif
   TrySendFull("init");
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
