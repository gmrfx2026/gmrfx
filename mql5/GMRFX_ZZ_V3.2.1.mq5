//+------------------------------------------------------------------+
//|  GMRFX_ZZ_V3.2.1.mq5                                            |
//|  ZigZag indicator dengan horizontal lines + breakout arrows      |
//|  Versi lanjutan dari GMRFX_ZZ v3.0                              |
//|  Buffer 0: Swing High, Buffer 1: Swing Low                      |
//+------------------------------------------------------------------+
#property copyright "GMRFX 2026"
#property version   "3.21"
#property description "Rudy (Petani Nganggur). Dibuat untuk kalangan sendiri - https://gmrfx.app"
#property indicator_chart_window
#property indicator_buffers 5
#property indicator_plots   5

// Plot 0 — ZigZag High points (dot)
#property indicator_label1  "ZZ High"
#property indicator_type1   DRAW_ARROW
#property indicator_color1  clrRed
#property indicator_width1  1

// Plot 1 — ZigZag Low points (dot)
#property indicator_label2  "ZZ Low"
#property indicator_type2   DRAW_ARROW
#property indicator_color2  clrLime
#property indicator_width2  1

// Plot 2 — ZigZag Line (garis penghubung)
#property indicator_label3  "ZZ Line"
#property indicator_type3   DRAW_SECTION
#property indicator_color3  clrDodgerBlue
#property indicator_style3  STYLE_SOLID
#property indicator_width3  1

// Plot 3 — Breakout Up arrow
#property indicator_label4  "Break Up"
#property indicator_type4   DRAW_ARROW
#property indicator_color4  clrLime
#property indicator_style4  STYLE_SOLID
#property indicator_width4  2

// Plot 4 — Breakout Down arrow
#property indicator_label5  "Break Down"
#property indicator_type5   DRAW_ARROW
#property indicator_color5  clrRed
#property indicator_style5  STYLE_SOLID
#property indicator_width5  2

// ══════════════════════════════════════════════════════════════
// ██  0. LICENSE (verifikasi ke gmrfx.app)                     ██
// ══════════════════════════════════════════════════════════════
#include <GMRFX_ZZ_WebLicense.mqh>
input bool   ForceChartBackground = true;     // Paksa Chart on Foreground = OFF

// ══════════════════════════════════════════════════════════════
// ██  1. ZIGZAG PARAMETER                                    ██
// ══════════════════════════════════════════════════════════════
input string _zz_hdr = "";            // ─── ZigZag Settings ───
input int    ZZ_Depth     = 12;       // Depth (bar kiri/kanan untuk swing)
input int    ZZ_Deviation = 5;        // Deviation (min jarak swing, points)
input int    ZZ_Backstep  = 3;        // Backstep (min bar antar swing)
input int    MaxBars      = 500;      // Max bars to calculate

// ══════════════════════════════════════════════════════════════
// ██  2. ZIGZAG DISPLAY                                      ██
// ══════════════════════════════════════════════════════════════
input string _zzd_hdr = "";           // ─── ZigZag Display ───
input bool   ShowZigZag          = true;   // Show ZigZag line
input bool   ShowCurrentZZPoint  = false;  // Show current ZZ-Point (redrawing)
input color  ZZColor          = clrRed;    // ZigZag line color
input int    ZZWidth          = 1;         // ZigZag line width
input ENUM_LINE_STYLE ZZStyle = STYLE_SOLID; // ZigZag line style
input bool   ShowSwingNumbers    = false;  // Show nomor swing (1,2,3...)

// ══════════════════════════════════════════════════════════════
// ██  3. HORIZONTAL LINES (Support/Resistance dari swing)    ██
// ══════════════════════════════════════════════════════════════
input string _hl_hdr = "";            // ─── Horizontal Lines ───
input bool   ShowHLines          = true;   // Show horizontal lines
input bool   ShowBrokenLines     = true;   // Show broken lines (sudah tertembus)
input bool   ShowPrice           = true;   // Show price label di key level
input bool   ShowTouches         = true;   // Show jumlah sentuhan (touches)
input bool   ShowDotAtStart      = true;   // Show dot di awal garis
input int    MaxLines            = 10;     // Max garis horizontal per sisi
input int    TouchOffset         = 100;    // Offset for touches (points)
input int    BrokenAfterBars     = 0;      // Auto-broken setelah X bars (0=off)
input int    ExtendBrokenBars    = 15;     // Extend broken lines (bars)

// ══════════════════════════════════════════════════════════════
// ██  4. LINES COLOR & STYLE                                 ██
// ══════════════════════════════════════════════════════════════
input string _lc_hdr = "";            // ─── Lines Color & Style ───
input color  ResistanceColor  = clrGreen;     // Resistance color (swing high)
input color  SupportColor     = clrRed;       // Support color (swing low)
input color  BrokenColor      = clrGray;      // Broken line color
input int    LineWidth        = 2;            // Key level line width
input ENUM_LINE_STYLE LineStyle    = STYLE_SOLID;   // Key level style (solid)
input ENUM_LINE_STYLE WeakStyle    = STYLE_DOT;     // Weak swing style (halus)
input ENUM_LINE_STYLE BrokenLineStyle = STYLE_DASHDOT; // Broken line style
input int    UsedLineWidth    = 1;            // Broken/weak line width
input ENUM_LINE_STYLE BrokenStyle = STYLE_DOT;     // (legacy) Used line style
input int    FontSizePrice    = 9;            // Font size harga
input int    FontSizeDot      = 10;           // Font size dot

// ══════════════════════════════════════════════════════════════
// ██  6. ADAPTIVE TREND LINES (dari swing ZigZag)            ██
// ══════════════════════════════════════════════════════════════
input string _atl_hdr = "";           // ─── Adaptive Trend Lines ───
input bool   ShowAdaptiveTL     = true;      // Show adaptive trend lines
enum ENUM_ATL_SOURCE { ATL_ZZ_SWING = 0, ATL_HL_PRICE = 1, ATL_LINREG = 2 };
input ENUM_ATL_SOURCE AdaptiveTLSource = ATL_LINREG; // Source (Swing ZZ / High-Low / LinReg)
input int    AdaptiveTLSwings   = 4;         // Swing/pivot count (mode Swing/HL)
input int    AdaptiveTLPeriod   = 14;        // Period (mode HL pivot & LinReg)
input double AdaptiveTLDeviation = 2.0;     // Deviation (LinReg channel width)
input color  AdaptiveUpColor    = clrNavy;   // Uptrend line color
input color  AdaptiveDownColor  = clrDarkOrange;    // Downtrend line color
input int    AdaptiveTLWidth    = 2;         // Line width
input ENUM_LINE_STYLE AdaptiveTLStyle = STYLE_SOLID; // Line style
input bool   AdaptiveTLRayRight = false;      // Extend line ke kanan
input bool   AdaptiveTLFill     = true;       // Isi background antar garis ATL
input color  AdaptiveTLFillUp   = C'200,240,200'; // Fill saat kedua garis UP (dongker)
input color  AdaptiveTLFillDown = C'255,200,210'; // Fill saat kedua garis DOWN (kuning)

// ══════════════════════════════════════════════════════════════
// ██  7. PIVOT TREND LINES (dari pivot high/low)             ██
// ══════════════════════════════════════════════════════════════
input string _ptl_hdr = "";           // ─── Pivot Trend Lines ───
input bool   ShowPivotTL       = false;      // Show pivot-based trend lines (matikan jika berat)
input int    PivotPeriod       = 20;         // Pivot period (bar kiri/kanan)
input int    PivotPoints       = 3;          // Min pivot points untuk garis
input int    PivotMaxLines     = 3;          // Max garis per sisi
input int    PivotScanCandles  = 500;        // Scan terdekat N candle
input color  PivotSupColor     = clrBlue;     // Support TL color
input color  PivotResColor     = clrRed;     // Resistance TL color
input color  PivotBrokenColor  = clrGray;    // Broken TL color
input int    PivotTLWidth      = 2;          // TL width
input ENUM_LINE_STYLE PivotActiveStyle = STYLE_SOLID; // Active TL style
input ENUM_LINE_STYLE PivotBrokenStyle = STYLE_DASH;  // Broken TL style
input bool   PivotShowLabels   = true;       // Show price labels
input bool   PivotFillChannel  = false;      // Fill area antara support-resistance
input color  PivotFillColor    = C'200,200,220'; // Fill channel color
input bool   PivotRayRight     = true;       // Extend garis ke kanan

// ══════════════════════════════════════════════════════════════
// ██  8. DAILY CANDLES (background harian)                   ██
// ══════════════════════════════════════════════════════════════
input string _dc_hdr = "";            // ─── Daily Candles ───
input bool   ShowDailyCandle    = true;          // Show daily candle background
input int    DailyCandleCount   = 3;             // Jumlah hari kebelakang
input bool   HideCurrentCandle  = false;         // Hide candle hari ini
input bool   UseShadowColor     = true;          // Aktifkan warna shadow (range area)
input color  DailyShadowColor   = C'253,241,227'; // Shadow color (high-low)
input bool   UseBodyColor       = true;          // Aktifkan warna body (open-close)
input color  DailyBullColor     = C'181,238,162'; // Body bullish color
input color  DailyBearColor     = C'239,223,114'; // Body bearish color
input bool   ShowDayOfWeek      = true;          // Show nama hari
input bool   ShowHighLowRange   = true;          // Show range points
input color  DailyLabelColor    = clrBrown;      // Warna label hari & range

// ══════════════════════════════════════════════════════════════
// ██  10. SUPPLY/DEMAND ZONES (DBR/RBD/RBR/DBD)              ██
// ══════════════════════════════════════════════════════════════
input string _sdz_hdr = "";           // ─── Supply/Demand Zones ───
input bool   ShowSDZones       = true;       // Show supply/demand zones
input double BaseMaxRatio      = 0.5;        // Base max ratio vs legs (0.1-0.9)
input int    MaxSDZones        = 10;         // Max zones to display
input color  DBRColor          = C'181,238,162'; // DBR zone (demand, reversal)
input color  RBDColor          = C'255,182,193'; // RBD zone (supply, reversal)
input color  RBRColor          = C'173,216,230'; // RBR zone (demand, continuation)
input color  DBDColor          = C'255,228,196'; // DBD zone (supply, continuation)
input bool   ShowSDLabel       = true;       // Show pattern label
input bool   ExtendSDZone      = true;       // Extend zone to current bar
input bool   ShowOrderBlock    = true;       // Tandai order block (base bar origin)
input color  OBLineColor       = clrOrange;  // Warna garis OB
input int    OBLineWidth       = 2;          // Lebar garis OB

// ══════════════════════════════════════════════════════════════
// ██  4b. AUTO FIBONACCI (muncul saat breakout)              ██
// ══════════════════════════════════════════════════════════════
input string _fib_hdr = "";                  // ─── Auto Fibo ───
input bool   ShowAutoFibo       = false;      // Show auto fib retracement
input color  FiboUpColor        = clrDodgerBlue; // Fib warna bullish (res break)
input color  FiboDownColor      = clrOrchid; // Fib warna bearish (sup break)
input int    FiboWidth          = 1;         // Fib line width
input bool   FiboRayRight       = false;     // Extend fib ke kanan

// ══════════════════════════════════════════════════════════════
// ██  5. BREAKOUT ARROWS                                     ██
// ══════════════════════════════════════════════════════════════
input string _ba_hdr = "";            // ─── Breakout Arrows ───
input bool   ShowBreakArrows    = false;     // Show breakout arrows
input color  BreakUpColor       = clrLime;   // Break Up arrow color
input color  BreakDownColor     = clrRed;    // Break Down arrow color
input int    BreakArrowSize     = 2;         // Arrow size

// ══════════════════════════════════════════════════════════════
// ██  8. ALERTS                                              ██
// ══════════════════════════════════════════════════════════════
input string _al_hdr = "";            // ─── Alerts ───
input bool   EnableBuyAlerts     = true;   // Enable buy alerts
input bool   EnableSellAlerts    = true;   // Enable sell alerts
input bool   AlertLineBreakout   = true;   // Alert when line breakout
input bool   AlertZZDirection    = false;  // Alert when ZZ direction change
input bool   AlertNearLine       = false;  // Alert when price near line
input bool   AlertSDZoneTouch    = true;   // Alert saat harga masuk SD zone
input int    AlertDistance       = 20;     // Distance for alert (points)
input bool   EnableAlertPopup    = true;   // Popup alert (window)
input bool   EnableAlertSound    = true;   // Play sound saat alert
input string AlertSoundFile      = "alert.wav"; // Nama file sound (MT5/Sounds)
input bool   EnableAlertPush     = false;  // Kirim push notification ke mobile
input bool   ShowTargets         = true;   // Show targets

// ══════════════════════════════════════════════════════════════
// ██  9. CANDLE TIMER                                        ██
// ══════════════════════════════════════════════════════════════
input string _ct_hdr = "";            // ─── Candle Timer ───
input bool   ShowCandleTimer   = true;          // Show candle timer
input color  TimerColor        = clrDarkBlue;      // Timer text color
input int    TimerFontSize     = 9;             // Timer font size
input ENUM_ANCHOR_POINT TimerAnchor = ANCHOR_RIGHT; // Timer position anchor

// ══════════════════════════════════════════════════════════════
// ██  13. MULTI-TIMEFRAME S/R                                ██
// ══════════════════════════════════════════════════════════════
input string _mtf_hdr = "";                    // ─── Multi-TF S/R ───
input bool   ShowMTFSR          = true;        // Show swing S/R dari TF lebih tinggi
input ENUM_TIMEFRAMES MTF_Timeframe = PERIOD_H4; // Timeframe sumber
input int    MTF_LookbackBars   = 100;         // Jumlah bar TF tinggi yg di-scan
input int    MTF_PivotWing      = 3;           // Bar kiri/kanan utk valid pivot
input int    MTF_MaxLines       = 5;           // Max garis per sisi
input color  MTF_ResColor       = clrMagenta;  // Warna resistance MTF
input color  MTF_SupColor       = clrAqua;     // Warna support MTF
input int    MTF_LineWidth      = 1;           // Width
input ENUM_LINE_STYLE MTF_LineStyle = STYLE_DASH; // Style
input bool   MTF_ShowLabel      = true;        // Label TF + price

// ══════════════════════════════════════════════════════════════
// ██  15. VOLUME PROFILE (di dalam SD zone)                  ██
// ══════════════════════════════════════════════════════════════
input string _vp_hdr = "";                     // ─── Volume Profile ───
input bool   ShowVolumeProfile  = true;        // Histogram volume di SD zone
input int    VP_NumBins         = 12;          // Jumlah bin harga per zone
input int    VP_MaxWidthBars    = 15;          // Lebar max histogram (bar)
input color  VP_BarColor        = C'60,100,160'; // Warna batang histogram
input color  VP_POCColor        = C'255,140,0'; // Warna POC (Point of Control)
input bool   VP_ShowPOC         = true;        // Garis POC di dalam zone
input bool   VP_UseRealVolume   = false;       // true=real volume, false=tick

// ══════════════════════════════════════════════════════════════
// ██  14. DIVERGENCE DETECTOR (ZigZag + RSI/MACD)            ██
// ══════════════════════════════════════════════════════════════
input string _div_hdr = "";                    // ─── Divergence Detector ───
input bool   ShowDivergence     = true;        // Deteksi divergence
enum ENUM_DIV_SOURCE { DIV_RSI = 0, DIV_MACD = 1 };
input ENUM_DIV_SOURCE DivergenceSource = DIV_RSI; // Indikator pembanding
input int    DivIndiPeriod      = 14;          // Periode RSI / MACD fast
input int    DivMACDSlow        = 26;          // MACD slow (hanya utk DIV_MACD)
input int    DivMACDSignal      = 9;           // MACD signal
input bool   DetectRegularDiv   = true;        // Regular divergence (reversal)
input bool   DetectHiddenDiv    = false;       // Hidden divergence (continuation)
input color  DivBullColor       = clrLime;     // Warna bullish div
input color  DivBearColor       = clrRed;      // Warna bearish div
input int    DivLineWidth       = 2;           // Line width
input bool   AlertDivergence    = true;        // Alert saat divergence muncul

// ══════════════════════════════════════════════════════════════
// ██  12. SESSION MARKERS (London / NY / Tokyo)              ██
// ══════════════════════════════════════════════════════════════
input string _ses_hdr = "";                    // ─── Session Markers ───
input bool   ShowSessions       = true;        // Tampilkan garis session
input int    SessionDaysBack    = 3;           // Berapa hari ke belakang
input bool   AutoDetectGMT      = true;        // Auto detect timezone broker
input int    BrokerGMTOffset    = 2;           // Offset manual (jika Auto=false)

input bool   ShowTokyo          = true;        // Sesi Tokyo
input int    TokyoOpenGMT       = 0;           // Tokyo open (GMT hour)
input int    TokyoCloseGMT      = 9;           // Tokyo close (GMT hour)
input color  TokyoColor         = C'100,150,230'; // Warna Tokyo

input bool   ShowLondon         = true;        // Sesi London
input int    LondonOpenGMT      = 8;           // London open (GMT hour)
input int    LondonCloseGMT     = 17;          // London close (GMT hour)
input color  LondonColor        = C'80,200,120'; // Warna London

input bool   ShowNY             = true;        // Sesi New York
input int    NYOpenGMT          = 13;          // NY open (GMT hour)
input int    NYCloseGMT         = 22;          // NY close (GMT hour)
input color  NYColor            = C'230,120,120'; // Warna NY

input bool   SessionFillBg      = false;       // Isi background session (vs garis saja)
input int    SessionLineStyle   = STYLE_DOT;   // Style garis session
input bool   ShowSessionLabel   = true;        // Label nama session di atas

// ══════════════════════════════════════════════════════════════
// ██  11. DASHBOARD PANEL (trend bias summary)               ██
// ══════════════════════════════════════════════════════════════
input string _dash_hdr = "";                    // ─── Dashboard ───
input bool   ShowDashboard     = true;          // Show dashboard panel
input ENUM_BASE_CORNER DashboardCorner = CORNER_LEFT_UPPER; // Posisi corner
input int    DashboardX        = 10;            // X offset (pixel)
input int    DashboardY        = 20;            // Y offset (pixel)
input int    DashboardWidth    = 220;           // Panel width
input color  DashBgColor       = C'30,40,55';   // Background color
input color  DashTitleBg       = C'20,80,140';  // Title bar color
input color  DashTextColor     = clrWhite;      // Text color
input color  DashAccentBull    = C'130,230,130'; // Warna bias bullish
input color  DashAccentBear    = C'255,130,130'; // Warna bias bearish
input color  DashAccentNeut    = C'200,200,200'; // Warna netral
input int    DashFontSize      = 8;             // Font size

//+------------------------------------------------------------------+
//| Globals                                                          |
//+------------------------------------------------------------------+
double ZZHighBuffer[];
double ZZLowBuffer[];
double ZZLineBuffer[];    // garis zigzag penghubung (DRAW_SECTION)
double BreakUpBuffer[];
double BreakDownBuffer[];

// Menyimpan level horizontal lines yang aktif
double   g_ResLevels[];   // resistance levels
double   g_SupLevels[];   // support levels
bool     g_ResBroken[];   // apakah sudah terbreak
bool     g_SupBroken[];   // apakah sudah terbreak
int      g_ResTouches[];  // jumlah sentuhan
int      g_SupTouches[];  // jumlah sentuhan
datetime g_ResTime[];      // waktu swing terbentuk
datetime g_SupTime[];      // waktu swing terbentuk
datetime g_ResBreakTime[]; // waktu garis terbreak
datetime g_SupBreakTime[]; // waktu garis terbreak
int      g_ResCount = 0;
int      g_SupCount = 0;

// Pivot Trend Lines storage
struct PivotPt { double price; int bar; datetime time; };
struct PivotTL { double startPrice, endPrice, slope; int startBar, endBar; bool broken; };
PivotPt  g_PvtHighs[];
PivotPt  g_PvtLows[];
int      g_PvtHighCnt = 0;
int      g_PvtLowCnt  = 0;
PivotTL  g_PvtResLines[];
PivotTL  g_PvtSupLines[];
int      g_PvtResLineCnt = 0;
int      g_PvtSupLineCnt = 0;

// Alert state tracking (anti-spam)
datetime g_LastAlertResBreak = 0;   // waktu alert break resistance terakhir
datetime g_LastAlertSupBreak = 0;   // waktu alert break support terakhir
datetime g_LastAlertZZDir    = 0;   // waktu alert ZZ direction terakhir
datetime g_LastAlertNearRes  = 0;   // waktu alert near res terakhir
datetime g_LastAlertNearSup  = 0;   // waktu alert near sup terakhir
datetime g_LastAlertSDZone   = 0;   // waktu alert SD zone touch terakhir
int      g_LastZZState       = 0;   // state ZZ terakhir: 1=HH/HL, -1=LL/LH, 0=none
double   g_LastZZSwingPrice  = 0;

// Dashboard state (di-cache saat OnCalculate, dibaca saat render)
bool     g_DashMinimized     = false;
bool     g_ATL_ResUp         = false; // ATL resistance slope up?
bool     g_ATL_SupUp         = false; // ATL support slope up?
bool     g_ATL_Valid         = false;
int      g_TotalBreaksUp     = 0;
int      g_TotalBreaksDown   = 0;
string   g_NearestSDZoneInfo = "-";   // ringkasan zona terdekat
#define  DASH_PREFIX "GMZZ_DASH_"

// Broker timezone detection
int      g_BrokerGMT         = 2;     // offset aktual yg dipakai (detected/manual)
string   g_BrokerTZLabel     = "?";   // label utk ditampilkan di dashboard

// Throttle timers (utk mengurangi beban rendering per tick)
datetime g_LastSessionDraw = 0;       // terakhir DrawSessions full redraw
datetime g_LastDailyDraw   = 0;       // terakhir DrawDailyCandles full redraw
datetime g_LastDashUpdate  = 0;       // terakhir DrawDashboard render
datetime g_LastTickAlert   = 0;       // terakhir CheckTickAlerts
datetime g_LastTimerUpdate = 0;       // terakhir DrawCandleTimer update
int      g_LastSessionDay  = 0;       // day-of-year saat session terakhir digambar

// Divergence detector
int      g_DivHandle = INVALID_HANDLE;        // handle indicator (RSI/MACD)
datetime g_LastAlertDiv = 0;                  // anti-spam alert divergence

//+------------------------------------------------------------------+
//| Detect broker timezone offset vs GMT                             |
//+------------------------------------------------------------------+
void UpdateBrokerTimezone()
{
   if(AutoDetectGMT)
   {
      datetime srv = TimeTradeServer();
      datetime gmt = TimeGMT();
      if(srv > 0 && gmt > 0)
      {
         // Round ke 0.5 jam terdekat supaya DST/kelipatan 30 menit tertangani
         double diffH = (double)(srv - gmt) / 3600.0;
         g_BrokerGMT = (int)MathRound(diffH);
      }
      else
      {
         g_BrokerGMT = BrokerGMTOffset;  // fallback
      }
   }
   else
   {
      g_BrokerGMT = BrokerGMTOffset;
   }

   // Label: "GMT+2" atau "GMT-5"
   if(g_BrokerGMT >= 0)
      g_BrokerTZLabel = "GMT+" + IntegerToString(g_BrokerGMT);
   else
      g_BrokerTZLabel = "GMT" + IntegerToString(g_BrokerGMT);

   // Tambahkan WIB equivalent (WIB = GMT+7)
   int wibDiff = 7 - g_BrokerGMT;
   if(wibDiff != 0)
   {
      g_BrokerTZLabel += StringFormat(" (WIB%s%d)",
                                      wibDiff >= 0 ? "+" : "",
                                      wibDiff);
   }
}

//+------------------------------------------------------------------+
//| Kirim alert multi-channel (popup / sound / push)                 |
//+------------------------------------------------------------------+
void FireAlert(string title, string body)
{
   string full = StringFormat("[%s %s] %s: %s",
                              _Symbol,
                              EnumToString((ENUM_TIMEFRAMES)_Period),
                              title, body);
   if(EnableAlertPopup) Alert(full);
   if(EnableAlertSound) PlaySound(AlertSoundFile);
   if(EnableAlertPush)  SendNotification(full);
   Print("GMRFX_ALERT: ", full);
}

//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
int OnInit()
{
   if(!GmrfxZZ_OnInitLicense())
      return INIT_FAILED;

   // Pastikan chart tidak di foreground supaya SD zone, daily candle bg,
   // dan ATL fill tampak di belakang candle harga
   if(ForceChartBackground)
      ChartSetInteger(0, CHART_FOREGROUND, false);

   SetIndexBuffer(0, ZZHighBuffer,    INDICATOR_DATA);
   SetIndexBuffer(1, ZZLowBuffer,     INDICATOR_DATA);
   SetIndexBuffer(2, ZZLineBuffer,    INDICATOR_DATA);
   SetIndexBuffer(3, BreakUpBuffer,   INDICATOR_DATA);
   SetIndexBuffer(4, BreakDownBuffer, INDICATOR_DATA);

   PlotIndexSetInteger(0, PLOT_ARROW, 159);  // Small dot for high
   PlotIndexSetInteger(1, PLOT_ARROW, 159);  // Small dot for low
   PlotIndexSetInteger(3, PLOT_ARROW, 233);  // Up arrow
   PlotIndexSetInteger(4, PLOT_ARROW, 234);  // Down arrow

   // Warna dari input
   PlotIndexSetInteger(0, PLOT_LINE_COLOR, SupportColor);   // dot high = resistance
   PlotIndexSetInteger(1, PLOT_LINE_COLOR, ResistanceColor); // dot low = support
   PlotIndexSetInteger(3, PLOT_LINE_COLOR, BreakUpColor);
   PlotIndexSetInteger(3, PLOT_LINE_WIDTH, BreakArrowSize);
   PlotIndexSetInteger(4, PLOT_LINE_COLOR, BreakDownColor);
   PlotIndexSetInteger(4, PLOT_LINE_WIDTH, BreakArrowSize);
   PlotIndexSetInteger(2, PLOT_LINE_COLOR, ZZColor);
   PlotIndexSetInteger(2, PLOT_LINE_WIDTH, ZZWidth);
   PlotIndexSetInteger(2, PLOT_LINE_STYLE, ZZStyle);

   PlotIndexSetDouble(0, PLOT_EMPTY_VALUE, EMPTY_VALUE);
   PlotIndexSetDouble(1, PLOT_EMPTY_VALUE, EMPTY_VALUE);
   PlotIndexSetDouble(2, PLOT_EMPTY_VALUE, EMPTY_VALUE);
   PlotIndexSetDouble(3, PLOT_EMPTY_VALUE, EMPTY_VALUE);
   PlotIndexSetDouble(4, PLOT_EMPTY_VALUE, EMPTY_VALUE);
   IndicatorSetString(INDICATOR_SHORTNAME, "GMRFX ZZ v3.2.1");

   ArrayResize(g_ResLevels, MaxLines);
   ArrayResize(g_SupLevels, MaxLines);
   ArrayResize(g_ResBroken, MaxLines);
   ArrayResize(g_SupBroken, MaxLines);
   ArrayResize(g_ResTouches, MaxLines);
   ArrayResize(g_SupTouches, MaxLines);
   ArrayResize(g_ResTime, MaxLines);
   ArrayResize(g_SupTime, MaxLines);
   ArrayResize(g_ResBreakTime, MaxLines);
   ArrayResize(g_SupBreakTime, MaxLines);

   // Pivot TL arrays
   ArrayResize(g_PvtHighs, PivotScanCandles);
   ArrayResize(g_PvtLows,  PivotScanCandles);
   ArrayResize(g_PvtResLines, PivotMaxLines);
   ArrayResize(g_PvtSupLines, PivotMaxLines);

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| OnDeinit                                                         |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   ObjectsDeleteAll(0, "GMZZ_");
   ObjectsDeleteAll(0, "GMTL_");
   Comment("");
   if(g_DivHandle != INVALID_HANDLE) IndicatorRelease(g_DivHandle);
}

//+------------------------------------------------------------------+
//| OnChartEvent — handle klik tombol dashboard                      |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam,
                  const double &dparam, const string &sparam)
{
   if(id == CHARTEVENT_OBJECT_CLICK && sparam == DASH_PREFIX + "BTN_MIN")
   {
      g_DashMinimized = !g_DashMinimized;
      ObjectSetInteger(0, sparam, OBJPROP_STATE, false);
      DrawDashboard();
   }
}

//+------------------------------------------------------------------+
//| Gambar garis horizontal                                          |
//+------------------------------------------------------------------+
void DrawHLine(string name, double price, color clr, int width, ENUM_LINE_STYLE style,
               datetime tStart = 0, datetime tEnd = 0)
{
   if(ObjectFind(0, name) < 0)
      ObjectCreate(0, name, OBJ_TREND, 0, tStart, price, tEnd, price);
   else
   {
      ObjectSetInteger(0, name, OBJPROP_TIME,  0, tStart);
      ObjectSetDouble(0, name, OBJPROP_PRICE, 0, price);
      ObjectSetInteger(0, name, OBJPROP_TIME,  1, tEnd);
      ObjectSetDouble(0, name, OBJPROP_PRICE, 1, price);
   }
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, width);
   ObjectSetInteger(0, name, OBJPROP_STYLE, style);
   ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, false);  // tidak extend ke kanan
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_HIDDEN, false);
   ObjectSetInteger(0, name, OBJPROP_BACK, true);
}

void DrawPriceLabel(string name, double price, datetime time, string text, color clr)
{
   if(ObjectFind(0, name) < 0)
      ObjectCreate(0, name, OBJ_TEXT, 0, time, price);
   else
   {
      ObjectSetDouble(0, name, OBJPROP_PRICE, price);
      ObjectMove(0, name, 0, time, price);
   }
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, FontSizePrice);
   ObjectSetString(0, name, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, name, OBJPROP_ANCHOR, ANCHOR_LEFT);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_BACK, false);
}

//+------------------------------------------------------------------+
//| Gambar Fibonacci retracement                                     |
//+------------------------------------------------------------------+
void DrawFibo(string name, datetime t1, double p1, datetime t2, double p2, color clr, bool rayRight)
{
   if(ObjectFind(0, name) < 0)
      ObjectCreate(0, name, OBJ_FIBO, 0, t1, p1, t2, p2);
   else
   {
      ObjectSetInteger(0, name, OBJPROP_TIME,  0, t1);
      ObjectSetDouble(0, name, OBJPROP_PRICE, 0, p1);
      ObjectSetInteger(0, name, OBJPROP_TIME,  1, t2);
      ObjectSetDouble(0, name, OBJPROP_PRICE, 1, p2);
   }
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, FiboWidth);
   ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, rayRight);
   ObjectSetInteger(0, name, OBJPROP_RAY_LEFT, false);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_BACK, false);
   ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);

   // Set warna untuk semua level fib (default level = kuning, kita samakan ke clr)
   int levels = (int)ObjectGetInteger(0, name, OBJPROP_LEVELS);
   for(int k = 0; k < levels; k++)
   {
      ObjectSetInteger(0, name, OBJPROP_LEVELCOLOR, k, clr);
      ObjectSetInteger(0, name, OBJPROP_LEVELWIDTH, k, FiboWidth);
      ObjectSetInteger(0, name, OBJPROP_LEVELSTYLE, k, STYLE_SOLID);
   }
}

//+------------------------------------------------------------------+
//| Candle Timer — hitungan mundur sampai candle baru                |
//+------------------------------------------------------------------+
void DrawCandleTimer()
{
   if(!ShowCandleTimer) return;

   string name = "GMZZ_TIMER";
   datetime barTime = iTime(NULL, PERIOD_CURRENT, 0);
   int periodSec = PeriodSeconds(PERIOD_CURRENT);
   datetime nextBar = barTime + periodSec;
   int remaining = (int)(nextBar - TimeCurrent());
   if(remaining < 0) remaining = 0;

   int hours = remaining / 3600;
   int mins  = (remaining % 3600) / 60;
   int secs  = remaining % 60;

   string txt;
   if(hours > 0)
      txt = StringFormat("%d:%02d:%02d", hours, mins, secs);
   else
      txt = StringFormat("%d:%02d", mins, secs);

   // Posisi: di kanan candle terakhir (geser 3 bar ke depan)
   double price = iClose(NULL, PERIOD_CURRENT, 0);
   datetime time = iTime(NULL, PERIOD_CURRENT, 0) + periodSec * 3;

   if(ObjectFind(0, name) < 0)
      ObjectCreate(0, name, OBJ_TEXT, 0, time, price);
   else
      ObjectMove(0, name, 0, time, price);

   ObjectSetString(0, name, OBJPROP_TEXT, txt);
   ObjectSetInteger(0, name, OBJPROP_COLOR, TimerColor);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, TimerFontSize);
   ObjectSetString(0, name, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, name, OBJPROP_ANCHOR, ANCHOR_LEFT);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
}

//+------------------------------------------------------------------+
//| Gambar daily candle sebagai background                           |
//+------------------------------------------------------------------+
void DrawDailyCandles()
{
   if(!ShowDailyCandle) return;

   for(int d = 0; d < DailyCandleCount; d++)
   {
      double dOpen = iOpen(NULL, PERIOD_D1, d);
      double dHigh = iHigh(NULL, PERIOD_D1, d);
      double dLow  = iLow(NULL, PERIOD_D1, d);
      double dClose = iClose(NULL, PERIOD_D1, d);
      datetime dTime = iTime(NULL, PERIOD_D1, d);
      datetime dEnd  = (d == 0) ? iTime(NULL, PERIOD_CURRENT, 0) : iTime(NULL, PERIOD_D1, d-1);

      if(dOpen == 0 || dHigh == 0) continue;
      if(d == 0 && HideCurrentCandle) continue;

      bool isBull = (dClose >= dOpen);
      double bodyTop = MathMax(dOpen, dClose);
      double bodyBot = MathMin(dOpen, dClose);

      // Day of week label + High-Low range
      if(ShowDayOfWeek || ShowHighLowRange)
      {
         MqlDateTime dt;
         TimeToStruct(dTime, dt);
         string dayNames[] = {"Sun","Mon","Tue","Wed","Thu","Fri","Sat"};
         string lbl = "";
         if(ShowDayOfWeek) lbl += dayNames[dt.day_of_week];
         if(ShowHighLowRange)
         {
            double pts = (dHigh - dLow) / _Point;
            if(lbl != "") lbl += ", ";
            lbl += IntegerToString((int)pts) + " pts";
         }
         string dlName = "GMZZ_DL_" + IntegerToString(d);
         if(ObjectFind(0, dlName) < 0)
            ObjectCreate(0, dlName, OBJ_TEXT, 0, dTime, dHigh);
         else
            ObjectMove(0, dlName, 0, dTime, dHigh);
         ObjectSetString(0, dlName, OBJPROP_TEXT, lbl);
         ObjectSetInteger(0, dlName, OBJPROP_COLOR, DailyLabelColor);
         ObjectSetInteger(0, dlName, OBJPROP_FONTSIZE, 8);
         ObjectSetString(0, dlName, OBJPROP_FONT, "Arial");
         ObjectSetInteger(0, dlName, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, dlName, OBJPROP_HIDDEN, true);
      }

      // Shadow (high-low range)
      if(UseShadowColor)
      {
         string shName = "GMZZ_DS_" + IntegerToString(d);
         if(ObjectFind(0, shName) < 0)
            ObjectCreate(0, shName, OBJ_RECTANGLE, 0, dTime, dHigh, dEnd, dLow);
         else
         {
            ObjectSetDouble(0, shName, OBJPROP_PRICE,  0, dHigh);
            ObjectSetDouble(0, shName, OBJPROP_PRICE,  1, dLow);
            ObjectSetInteger(0, shName, OBJPROP_TIME,  0, dTime);
            ObjectSetInteger(0, shName, OBJPROP_TIME,  1, dEnd);
         }
         ObjectSetInteger(0, shName, OBJPROP_COLOR, DailyShadowColor);
         ObjectSetInteger(0, shName, OBJPROP_FILL, true);
         ObjectSetInteger(0, shName, OBJPROP_BACK, true);
         ObjectSetInteger(0, shName, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, shName, OBJPROP_HIDDEN, true);
      }

      // Body (open-close)
      if(UseBodyColor)
      {
         string bdName = "GMZZ_DB_" + IntegerToString(d);
         if(ObjectFind(0, bdName) < 0)
            ObjectCreate(0, bdName, OBJ_RECTANGLE, 0, dTime, bodyTop, dEnd, bodyBot);
         else
         {
            ObjectSetDouble(0, bdName, OBJPROP_PRICE,  0, bodyTop);
            ObjectSetDouble(0, bdName, OBJPROP_PRICE,  1, bodyBot);
            ObjectSetInteger(0, bdName, OBJPROP_TIME,  0, dTime);
            ObjectSetInteger(0, bdName, OBJPROP_TIME,  1, dEnd);
         }
         ObjectSetInteger(0, bdName, OBJPROP_COLOR, isBull ? DailyBullColor : DailyBearColor);
         ObjectSetInteger(0, bdName, OBJPROP_FILL, true);
         ObjectSetInteger(0, bdName, OBJPROP_BACK, true);
         ObjectSetInteger(0, bdName, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, bdName, OBJPROP_HIDDEN, true);
      }
   }
}

//+------------------------------------------------------------------+
//| Tambah level baru ke array                                       |
//+------------------------------------------------------------------+
void AddResistanceLevel(double level, datetime tm = 0)
{
   for(int i = 0; i < g_ResCount; i++)
      if(MathAbs(g_ResLevels[i] - level) < _Point * 5) return;

   if(g_ResCount < MaxLines)
   {
      g_ResLevels[g_ResCount] = level;
      g_ResBroken[g_ResCount] = false;
      g_ResTouches[g_ResCount] = 0;
      g_ResTime[g_ResCount] = tm;
      g_ResBreakTime[g_ResCount] = 0;
      g_ResCount++;
   }
   else
   {
      for(int i = 0; i < MaxLines - 1; i++)
      {
         g_ResLevels[i]  = g_ResLevels[i+1];
         g_ResBroken[i]  = g_ResBroken[i+1];
         g_ResTouches[i] = g_ResTouches[i+1];
         g_ResTime[i]      = g_ResTime[i+1];
         g_ResBreakTime[i] = g_ResBreakTime[i+1];
      }
      g_ResLevels[MaxLines-1] = level;
      g_ResBroken[MaxLines-1] = false;
      g_ResTouches[MaxLines-1] = 0;
      g_ResTime[MaxLines-1] = tm;
      g_ResBreakTime[MaxLines-1] = 0;
   }
}

void AddSupportLevel(double level, datetime tm = 0)
{
   for(int i = 0; i < g_SupCount; i++)
      if(MathAbs(g_SupLevels[i] - level) < _Point * 5) return;

   if(g_SupCount < MaxLines)
   {
      g_SupLevels[g_SupCount] = level;
      g_SupBroken[g_SupCount] = false;
      g_SupTouches[g_SupCount] = 0;
      g_SupTime[g_SupCount] = tm;
      g_SupBreakTime[g_SupCount] = 0;
      g_SupCount++;
   }
   else
   {
      for(int i = 0; i < MaxLines - 1; i++)
      {
         g_SupLevels[i]  = g_SupLevels[i+1];
         g_SupBroken[i]  = g_SupBroken[i+1];
         g_SupTouches[i] = g_SupTouches[i+1];
         g_SupTime[i]      = g_SupTime[i+1];
         g_SupBreakTime[i] = g_SupBreakTime[i+1];
      }
      g_SupLevels[MaxLines-1] = level;
      g_SupBroken[MaxLines-1] = false;
      g_SupTouches[MaxLines-1] = 0;
      g_SupTime[MaxLines-1] = tm;
      g_SupBreakTime[MaxLines-1] = 0;
   }
}

//+------------------------------------------------------------------+
//| Cari highest high dalam range [from..to] (AsSeries)             |
//+------------------------------------------------------------------+
int HighestBar(const double &high[], int from, int count, int total)
{
   int best = from;
   for(int k = from; k < from + count && k < total; k++)
      if(high[k] > high[best]) best = k;
   return best;
}

int LowestBar(const double &low[], int from, int count, int total)
{
   int best = from;
   for(int k = from; k < from + count && k < total; k++)
      if(low[k] < low[best]) best = k;
   return best;
}

//+------------------------------------------------------------------+
//| Dashboard helpers                                                |
//+------------------------------------------------------------------+
void DashCreateBG(string name, int x, int y, int w, int h, color bg)
{
   if(ObjectFind(0, name) < 0)
      ObjectCreate(0, name, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_CORNER, DashboardCorner);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
   ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
   ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg);
   ObjectSetInteger(0, name, OBJPROP_COLOR, bg);
   ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_FLAT);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
   ObjectSetInteger(0, name, OBJPROP_BACK, false);
}

void DashCreateLabel(string name, int x, int y, string txt, color clr, int fs)
{
   if(ObjectFind(0, name) < 0)
      ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_CORNER, DashboardCorner);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetString(0, name, OBJPROP_TEXT, txt);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, fs);
   ObjectSetString(0, name, OBJPROP_FONT, "Consolas");
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
   ObjectSetInteger(0, name, OBJPROP_ANCHOR, ANCHOR_LEFT_UPPER);
}

void DashCreateButton(string name, int x, int y, int w, int h, string txt, color bg, color clr)
{
   if(ObjectFind(0, name) < 0)
      ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_CORNER, DashboardCorner);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
   ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
   ObjectSetString(0, name, OBJPROP_TEXT, txt);
   ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, bg);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 9);
   ObjectSetString(0, name, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, name, OBJPROP_STATE, false);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
}

//+------------------------------------------------------------------+
//| Render dashboard panel                                           |
//+------------------------------------------------------------------+
void DrawDashboard()
{
   if(!ShowDashboard) { ObjectsDeleteAll(0, DASH_PREFIX); return; }

   int x = DashboardX;
   int y = DashboardY;
   int w = DashboardWidth;
   int titleH = 22;
   int rowH = 16;
   int padX = 8;

   // Title bar (selalu tampil)
   DashCreateBG(DASH_PREFIX + "TBAR", x, y, w, titleH, DashTitleBg);
   DashCreateLabel(DASH_PREFIX + "TITLE", x + padX, y + 5,
                   "GMRFX ZZ v3.2.1", DashTextColor, 9);

   // Tombol minimize / expand di kanan title
   int btnW = 22, btnH = titleH - 4;
   int btnX = x + w - btnW - 2;
   int btnY = y + 2;
   DashCreateButton(DASH_PREFIX + "BTN_MIN", btnX, btnY, btnW, btnH,
                    g_DashMinimized ? "+" : "-",
                    DashTitleBg, DashTextColor);

   if(g_DashMinimized)
   {
      ObjectDelete(0, DASH_PREFIX + "BODY");
      for(int i = 0; i < 15; i++)
         ObjectDelete(0, DASH_PREFIX + "R" + IntegerToString(i));
      ChartRedraw();
      return;
   }

   // Background body
   int bodyRows = 9;
   int bodyH = bodyRows * rowH + 10;
   DashCreateBG(DASH_PREFIX + "BODY", x, y + titleH, w, bodyH, DashBgColor);

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   int rowIdx = 0;
   int rowX = x + padX;
   int rowY = y + titleH + 6;

   // R0: Symbol + TF + Price
   string tf = EnumToString((ENUM_TIMEFRAMES)_Period);
   StringReplace(tf, "PERIOD_", "");
   DashCreateLabel(DASH_PREFIX + "R0", rowX, rowY + rowIdx * rowH,
                   StringFormat("%s %s  %s", _Symbol, tf,
                                DoubleToString(bid, _Digits)),
                   DashTextColor, DashFontSize);
   rowIdx++;

   // R1: ATL Bias
   string biasTxt;
   color biasClr;
   if(g_ATL_Valid && g_ATL_ResUp && g_ATL_SupUp)
   { biasTxt = "BIAS   : BULLISH"; biasClr = DashAccentBull; }
   else if(g_ATL_Valid && !g_ATL_ResUp && !g_ATL_SupUp)
   { biasTxt = "BIAS   : BEARISH"; biasClr = DashAccentBear; }
   else
   { biasTxt = "BIAS   : NEUTRAL"; biasClr = DashAccentNeut; }
   DashCreateLabel(DASH_PREFIX + "R1", rowX, rowY + rowIdx * rowH,
                   biasTxt, biasClr, DashFontSize);
   rowIdx++;

   // R2: Nearest Resistance
   double nearRes = 0;
   for(int i = 0; i < g_ResCount; i++)
   {
      if(g_ResBroken[i]) continue;
      double lv = g_ResLevels[i];
      if(lv > bid && (nearRes == 0 || lv < nearRes)) nearRes = lv;
   }
   string rTxt = nearRes > 0
      ? StringFormat("RES    : %s (+%d p)",
                     DoubleToString(nearRes, _Digits),
                     (int)((nearRes - bid) / _Point))
      : "RES    : -";
   DashCreateLabel(DASH_PREFIX + "R2", rowX, rowY + rowIdx * rowH,
                   rTxt, DashAccentBear, DashFontSize);
   rowIdx++;

   // R3: Nearest Support
   double nearSup = 0;
   for(int i = 0; i < g_SupCount; i++)
   {
      if(g_SupBroken[i]) continue;
      double lv = g_SupLevels[i];
      if(lv < bid && (nearSup == 0 || lv > nearSup)) nearSup = lv;
   }
   string sTxt = nearSup > 0
      ? StringFormat("SUP    : %s (-%d p)",
                     DoubleToString(nearSup, _Digits),
                     (int)((bid - nearSup) / _Point))
      : "SUP    : -";
   DashCreateLabel(DASH_PREFIX + "R3", rowX, rowY + rowIdx * rowH,
                   sTxt, DashAccentBull, DashFontSize);
   rowIdx++;

   // R4: ZZ direction
   string zzTxt;
   color zzClr;
   if(g_LastZZState == 1)
   { zzTxt = "ZZ DIR : UP  @ " + DoubleToString(g_LastZZSwingPrice, _Digits);
     zzClr = DashAccentBull; }
   else if(g_LastZZState == -1)
   { zzTxt = "ZZ DIR : DOWN@ " + DoubleToString(g_LastZZSwingPrice, _Digits);
     zzClr = DashAccentBear; }
   else
   { zzTxt = "ZZ DIR : -"; zzClr = DashAccentNeut; }
   DashCreateLabel(DASH_PREFIX + "R4", rowX, rowY + rowIdx * rowH,
                   zzTxt, zzClr, DashFontSize);
   rowIdx++;

   // R5: SD zone terdekat
   DashCreateLabel(DASH_PREFIX + "R5", rowX, rowY + rowIdx * rowH,
                   "SD ZN  : " + g_NearestSDZoneInfo, DashTextColor, DashFontSize);
   rowIdx++;

   // R6: Break count
   DashCreateLabel(DASH_PREFIX + "R6", rowX, rowY + rowIdx * rowH,
                   StringFormat("BREAKS : UP=%d  DN=%d",
                                g_TotalBreaksUp, g_TotalBreaksDown),
                   DashTextColor, DashFontSize);
   rowIdx++;

   // R7: Server time
   DashCreateLabel(DASH_PREFIX + "R7", rowX, rowY + rowIdx * rowH,
                   "TIME   : " + TimeToString(TimeCurrent(), TIME_MINUTES|TIME_SECONDS),
                   DashAccentNeut, DashFontSize);
   rowIdx++;

   // R8: Broker timezone
   DashCreateLabel(DASH_PREFIX + "R8", rowX, rowY + rowIdx * rowH,
                   "TZ     : " + g_BrokerTZLabel,
                   DashAccentNeut, DashFontSize);

   // ChartRedraw() dihapus — biarkan MT5 batching redraw natural (lebih ringan)
}

//+------------------------------------------------------------------+
//| Cache data utk dashboard (dipanggil setelah analisa selesai)     |
//+------------------------------------------------------------------+
void UpdateDashboardCache(double bid)
{
   g_TotalBreaksUp   = 0;
   g_TotalBreaksDown = 0;
   for(int i = 0; i < g_ResCount; i++) if(g_ResBroken[i]) g_TotalBreaksUp++;
   for(int i = 0; i < g_SupCount; i++) if(g_SupBroken[i]) g_TotalBreaksDown++;

   double nearestDist = 0;
   string nearestInfo = "-";
   int total = ObjectsTotal(0, -1, OBJ_RECTANGLE);
   for(int k = 0; k < total; k++)
   {
      string nm = ObjectName(0, k, -1, OBJ_RECTANGLE);
      if(StringFind(nm, "GMZZ_SDZ_") != 0) continue;
      double p1 = ObjectGetDouble(0, nm, OBJPROP_PRICE, 0);
      double p2 = ObjectGetDouble(0, nm, OBJPROP_PRICE, 1);
      double mid = (p1 + p2) / 2.0;
      double d = MathAbs(bid - mid);
      if(nearestInfo == "-" || d < nearestDist)
      {
         nearestDist = d;
         color zc = (color)ObjectGetInteger(0, nm, OBJPROP_COLOR);
         string zType = "?";
         if(zc == DBRColor) zType = "DBR";
         else if(zc == RBDColor) zType = "RBD";
         else if(zc == RBRColor) zType = "RBR";
         else if(zc == DBDColor) zType = "DBD";
         nearestInfo = StringFormat("%s %s", zType, DoubleToString(mid, _Digits));
      }
   }
   g_NearestSDZoneInfo = nearestInfo;
}

//+------------------------------------------------------------------+
//| Session markers — garis vertikal open/close per sesi             |
//+------------------------------------------------------------------+
void DrawOneSession(string prefix, datetime dayStart, int openGMT, int closeGMT,
                    color clr, string label)
{
   // Konversi GMT hour → broker time (pakai offset aktual yg terdeteksi)
   datetime openT  = dayStart + (openGMT  + g_BrokerGMT) * 3600;
   datetime closeT = dayStart + (closeGMT + g_BrokerGMT) * 3600;

   // Handle wrap melewati midnight (mis. Tokyo close > 24h shift negatif)
   if(closeT < openT) closeT += 86400;

   string openName  = prefix + "_O";
   string closeName = prefix + "_C";

   // Garis vertikal open
   if(ObjectFind(0, openName) < 0)
      ObjectCreate(0, openName, OBJ_VLINE, 0, openT, 0);
   else
      ObjectSetInteger(0, openName, OBJPROP_TIME, 0, openT);
   ObjectSetInteger(0, openName, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, openName, OBJPROP_STYLE, SessionLineStyle);
   ObjectSetInteger(0, openName, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, openName, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, openName, OBJPROP_HIDDEN, true);
   ObjectSetInteger(0, openName, OBJPROP_BACK, true);

   // Garis vertikal close
   if(ObjectFind(0, closeName) < 0)
      ObjectCreate(0, closeName, OBJ_VLINE, 0, closeT, 0);
   else
      ObjectSetInteger(0, closeName, OBJPROP_TIME, 0, closeT);
   ObjectSetInteger(0, closeName, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, closeName, OBJPROP_STYLE, SessionLineStyle);
   ObjectSetInteger(0, closeName, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, closeName, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, closeName, OBJPROP_HIDDEN, true);
   ObjectSetInteger(0, closeName, OBJPROP_BACK, true);

   // Fill background opsional (rectangle di bawah session)
   if(SessionFillBg)
   {
      double dHigh = iHigh(NULL, PERIOD_D1, 0);
      double dLow  = iLow(NULL, PERIOD_D1, 0);
      if(dHigh > 0 && dLow > 0)
      {
         string rectName = prefix + "_BG";
         if(ObjectFind(0, rectName) < 0)
            ObjectCreate(0, rectName, OBJ_RECTANGLE, 0, openT, dHigh, closeT, dLow);
         else
         {
            ObjectSetInteger(0, rectName, OBJPROP_TIME,  0, openT);
            ObjectSetDouble (0, rectName, OBJPROP_PRICE, 0, dHigh);
            ObjectSetInteger(0, rectName, OBJPROP_TIME,  1, closeT);
            ObjectSetDouble (0, rectName, OBJPROP_PRICE, 1, dLow);
         }
         // Warna lembut (alpha rendah tidak tersedia utk color solid MT5,
         // jadi pakai warna yg di-input saja)
         ObjectSetInteger(0, rectName, OBJPROP_COLOR, clr);
         ObjectSetInteger(0, rectName, OBJPROP_FILL,  true);
         ObjectSetInteger(0, rectName, OBJPROP_BACK,  true);
         ObjectSetInteger(0, rectName, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, rectName, OBJPROP_HIDDEN, true);
      }
   }

   // Label nama session — tempatkan di OPEN session supaya jelas kapan mulai
   if(ShowSessionLabel && label != "")
   {
      string lblName = prefix + "_L";
      double dH = iHigh(NULL, PERIOD_D1, 0);
      if(dH <= 0) dH = SymbolInfoDouble(_Symbol, SYMBOL_BID);

      // Tambah status: (active) / (done) / (waiting)
      datetime now = TimeCurrent();
      string status = "";
      if(now >= openT && now <= closeT)      status = " (active)";
      else if(now > closeT)                  status = " (done)";
      else                                   status = "";

      if(ObjectFind(0, lblName) < 0)
         ObjectCreate(0, lblName, OBJ_TEXT, 0, openT, dH);
      else
         ObjectMove(0, lblName, 0, openT, dH);
      ObjectSetString(0, lblName, OBJPROP_TEXT, label + status);
      ObjectSetInteger(0, lblName, OBJPROP_COLOR, clr);
      ObjectSetInteger(0, lblName, OBJPROP_FONTSIZE, 8);
      ObjectSetString(0, lblName, OBJPROP_FONT, "Arial Bold");
      ObjectSetInteger(0, lblName, OBJPROP_ANCHOR, ANCHOR_LEFT_LOWER);
      ObjectSetInteger(0, lblName, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, lblName, OBJPROP_HIDDEN, true);
   }
}

void DrawSessions()
{
   if(!ShowSessions) { ObjectsDeleteAll(0, "GMZZ_SES_"); return; }
   // TIDAK ObjectsDeleteAll — biarkan update in-place supaya ringan
   // Object lama ter-reuse via ObjectFind di DrawOneSession

   for(int d = 0; d < SessionDaysBack; d++)
   {
      datetime dayT = iTime(NULL, PERIOD_D1, d);
      if(dayT == 0) continue;

      string dayKey = "GMZZ_SES_D" + IntegerToString(d);

      if(ShowTokyo)
         DrawOneSession(dayKey + "_TK", dayT, TokyoOpenGMT, TokyoCloseGMT,
                        TokyoColor, d == 0 ? "TOKYO" : "");
      if(ShowLondon)
         DrawOneSession(dayKey + "_LN", dayT, LondonOpenGMT, LondonCloseGMT,
                        LondonColor, d == 0 ? "LONDON" : "");
      if(ShowNY)
         DrawOneSession(dayKey + "_NY", dayT, NYOpenGMT, NYCloseGMT,
                        NYColor, d == 0 ? "NEW YORK" : "");
   }
}

//+------------------------------------------------------------------+
//| Volume Profile per SD zone — histogram volume per bin harga      |
//+------------------------------------------------------------------+
void DrawVolumeProfileInZone(string zoneName, int zoneIdx,
                              datetime t1, datetime t2,
                              double zTop, double zBot,
                              const double &high[], const double &low[],
                              const datetime &time[],
                              const long &tick_volume[], const long &volume[],
                              int rates_total)
{
   if(!ShowVolumeProfile || VP_NumBins < 2) return;
   if(zTop <= zBot) return;

   int bins = MathMax(2, VP_NumBins);
   double binHeight = (zTop - zBot) / bins;
   double binVol[];
   ArrayResize(binVol, bins);
   ArrayInitialize(binVol, 0);

   // Cari bar-bar dalam range zone: iterate bar series (AsSeries=true)
   double maxVol = 0;
   int barsInZone = 0;
   for(int b = 0; b < rates_total && barsInZone < 2000; b++)
   {
      if(time[b] < t1) break;     // sudah lewat start zone, stop (urut desc)
      if(time[b] > t2) continue;  // bar di masa depan relatif t2, skip

      double bHigh = high[b], bLow = low[b];
      double overlapTop = MathMin(bHigh, zTop);
      double overlapBot = MathMax(bLow, zBot);
      if(overlapTop <= overlapBot) continue;

      long v = VP_UseRealVolume ? volume[b] : tick_volume[b];
      if(v <= 0) continue;

      double barRange = bHigh - bLow;
      if(barRange <= 0) continue;

      double overlapRatio = (overlapTop - overlapBot) / barRange;
      double volContrib = (double)v * overlapRatio;

      // Distribusikan ke bin yg ter-cover
      int binLow  = (int)MathMax(0, MathFloor((overlapBot - zBot) / binHeight));
      int binHigh = (int)MathMin(bins - 1, MathFloor((overlapTop - zBot) / binHeight));
      int binSpan = binHigh - binLow + 1;
      if(binSpan <= 0) continue;
      double volPerBin = volContrib / binSpan;
      for(int bi = binLow; bi <= binHigh; bi++)
         binVol[bi] += volPerBin;

      barsInZone++;
   }

   // Cari max volume utk normalisasi width
   int pocBin = 0;
   for(int bi = 0; bi < bins; bi++)
   {
      if(binVol[bi] > maxVol) { maxVol = binVol[bi]; pocBin = bi; }
   }
   if(maxVol <= 0) return;

   // Width dalam time (pakai multiplier bar current TF)
   int periodSec = PeriodSeconds(PERIOD_CURRENT);
   if(periodSec <= 0) return;

   // Histogram mulai dari t1 → ke kiri sebanyak VP_MaxWidthBars * bar width
   // Tapi itu akan tumpang tindih dengan bar history. Lebih baik: mulai dari t1,
   // berbentuk rectangle ke kanan (intra-zone).
   // Bin width per batang = (t2 - t1) * (binVol / maxVol), anchored ke t1
   long tDiff = (long)t2 - (long)t1;
   if(tDiff <= 0) return;

   // Clamp max width ke VP_MaxWidthBars * periodSec biar tidak over-stretch
   long maxW = (long)VP_MaxWidthBars * periodSec;
   long baseW = MathMin(tDiff, maxW);

   for(int bi = 0; bi < bins; bi++)
   {
      if(binVol[bi] <= 0) continue;
      double ratio = binVol[bi] / maxVol;
      long barW = (long)(baseW * ratio);
      if(barW < periodSec) continue;

      double binBot = zBot + bi * binHeight;
      double binTop = binBot + binHeight * 0.9; // sedikit gap antar bin

      datetime tStart = t1;
      datetime tEnd   = (datetime)((long)t1 + barW);

      string nm = "GMZZ_VP_" + IntegerToString(zoneIdx) + "_B" + IntegerToString(bi);
      if(ObjectFind(0, nm) < 0)
         ObjectCreate(0, nm, OBJ_RECTANGLE, 0, tStart, binTop, tEnd, binBot);
      else
      {
         ObjectSetInteger(0, nm, OBJPROP_TIME,  0, tStart);
         ObjectSetDouble (0, nm, OBJPROP_PRICE, 0, binTop);
         ObjectSetInteger(0, nm, OBJPROP_TIME,  1, tEnd);
         ObjectSetDouble (0, nm, OBJPROP_PRICE, 1, binBot);
      }
      ObjectSetInteger(0, nm, OBJPROP_COLOR, (bi == pocBin && VP_ShowPOC) ? VP_POCColor : VP_BarColor);
      ObjectSetInteger(0, nm, OBJPROP_FILL, true);
      ObjectSetInteger(0, nm, OBJPROP_BACK, false);  // di atas zone background
      ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, nm, OBJPROP_HIDDEN, true);
   }

   // Garis horizontal POC di tengah bin POC
   if(VP_ShowPOC)
   {
      double pocPrice = zBot + (pocBin + 0.5) * binHeight;
      string pnm = "GMZZ_VP_" + IntegerToString(zoneIdx) + "_POC";
      if(ObjectFind(0, pnm) < 0)
         ObjectCreate(0, pnm, OBJ_TREND, 0, t1, pocPrice, t2, pocPrice);
      else
      {
         ObjectSetInteger(0, pnm, OBJPROP_TIME, 0, t1);
         ObjectSetDouble (0, pnm, OBJPROP_PRICE, 0, pocPrice);
         ObjectSetInteger(0, pnm, OBJPROP_TIME, 1, t2);
         ObjectSetDouble (0, pnm, OBJPROP_PRICE, 1, pocPrice);
      }
      ObjectSetInteger(0, pnm, OBJPROP_COLOR, VP_POCColor);
      ObjectSetInteger(0, pnm, OBJPROP_WIDTH, 2);
      ObjectSetInteger(0, pnm, OBJPROP_STYLE, STYLE_SOLID);
      ObjectSetInteger(0, pnm, OBJPROP_RAY_RIGHT, false);
      ObjectSetInteger(0, pnm, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, pnm, OBJPROP_HIDDEN, true);
      ObjectSetInteger(0, pnm, OBJPROP_BACK, false);
   }
}

//+------------------------------------------------------------------+
//| Multi-Timeframe S/R — swing pivots dari TF lebih tinggi          |
//+------------------------------------------------------------------+
void DrawMTFSR()
{
   ObjectsDeleteAll(0, "GMZZ_MTFR_");
   ObjectsDeleteAll(0, "GMZZ_MTFS_");
   if(!ShowMTFSR) return;

   // Hanya tarik MTF dari TF yg lebih tinggi dari chart saat ini
   if(PeriodSeconds(MTF_Timeframe) <= PeriodSeconds(PERIOD_CURRENT)) return;

   int per = MathMax(2, MTF_PivotWing);
   int lookback = MathMax(per * 2 + 5, MTF_LookbackBars);

   // Ambil data high/low MTF
   double mH[], mL[];
   datetime mT[];
   ArraySetAsSeries(mH, true); ArraySetAsSeries(mL, true); ArraySetAsSeries(mT, true);
   int gotH = CopyHigh(_Symbol, MTF_Timeframe, 0, lookback, mH);
   int gotL = CopyLow (_Symbol, MTF_Timeframe, 0, lookback, mL);
   int gotT = CopyTime(_Symbol, MTF_Timeframe, 0, lookback, mT);
   if(gotH <= 0 || gotL <= 0 || gotT <= 0) return;
   int cnt = MathMin(MathMin(gotH, gotL), gotT);

   // Kumpulkan pivot highs & lows
   double pivH[], pivL[];
   datetime pivTH[], pivTL[];
   int hCnt = 0, lCnt = 0;
   ArrayResize(pivH, MTF_MaxLines * 3);
   ArrayResize(pivL, MTF_MaxLines * 3);
   ArrayResize(pivTH, MTF_MaxLines * 3);
   ArrayResize(pivTL, MTF_MaxLines * 3);

   // Scan dari terbaru (i=per) ke lama
   for(int i = per; i < cnt - per && (hCnt < MTF_MaxLines * 3 || lCnt < MTF_MaxLines * 3); i++)
   {
      // Pivot high: mH[i] > mH[i-k] & mH[i+k] utk semua k 1..per
      bool isPH = true;
      for(int k = 1; k <= per; k++)
         if(mH[i] <= mH[i-k] || mH[i] <= mH[i+k]) { isPH = false; break; }
      if(isPH && hCnt < MTF_MaxLines * 3)
      {
         pivH[hCnt] = mH[i]; pivTH[hCnt] = mT[i]; hCnt++;
      }
      // Pivot low
      bool isPL = true;
      for(int k = 1; k <= per; k++)
         if(mL[i] >= mL[i-k] || mL[i] >= mL[i+k]) { isPL = false; break; }
      if(isPL && lCnt < MTF_MaxLines * 3)
      {
         pivL[lCnt] = mL[i]; pivTL[lCnt] = mT[i]; lCnt++;
      }
   }

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   string tfStr = EnumToString(MTF_Timeframe);
   StringReplace(tfStr, "PERIOD_", "");

   // Pilih N res terdekat di ATAS bid
   double shownRes[]; ArrayResize(shownRes, 0);
   for(int i = 0; i < hCnt && ArraySize(shownRes) < MTF_MaxLines; i++)
   {
      if(pivH[i] <= bid) continue;
      // skip duplikat (dalam 10 * _Point)
      bool dup = false;
      for(int k = 0; k < ArraySize(shownRes); k++)
         if(MathAbs(shownRes[k] - pivH[i]) < _Point * 10) { dup = true; break; }
      if(dup) continue;

      int idx = ArraySize(shownRes);
      ArrayResize(shownRes, idx + 1);
      shownRes[idx] = pivH[i];

      string nm = "GMZZ_MTFR_" + IntegerToString(idx);
      if(ObjectFind(0, nm) < 0)
         ObjectCreate(0, nm, OBJ_TREND, 0, pivTH[i], pivH[i], TimeCurrent(), pivH[i]);
      ObjectSetInteger(0, nm, OBJPROP_TIME, 0, pivTH[i]);
      ObjectSetDouble (0, nm, OBJPROP_PRICE, 0, pivH[i]);
      ObjectSetInteger(0, nm, OBJPROP_TIME, 1, TimeCurrent());
      ObjectSetDouble (0, nm, OBJPROP_PRICE, 1, pivH[i]);
      ObjectSetInteger(0, nm, OBJPROP_COLOR, MTF_ResColor);
      ObjectSetInteger(0, nm, OBJPROP_WIDTH, MTF_LineWidth);
      ObjectSetInteger(0, nm, OBJPROP_STYLE, MTF_LineStyle);
      ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, true);
      ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, nm, OBJPROP_BACK, false);

      if(MTF_ShowLabel)
      {
         string lnm = "GMZZ_MTFR_L" + IntegerToString(idx);
         if(ObjectFind(0, lnm) < 0)
            ObjectCreate(0, lnm, OBJ_TEXT, 0, TimeCurrent(), pivH[i]);
         else
            ObjectMove(0, lnm, 0, TimeCurrent(), pivH[i]);
         ObjectSetString(0, lnm, OBJPROP_TEXT,
                         tfStr + " R " + DoubleToString(pivH[i], _Digits));
         ObjectSetInteger(0, lnm, OBJPROP_COLOR, MTF_ResColor);
         ObjectSetInteger(0, lnm, OBJPROP_FONTSIZE, 7);
         ObjectSetString(0, lnm, OBJPROP_FONT, "Arial");
         ObjectSetInteger(0, lnm, OBJPROP_ANCHOR, ANCHOR_RIGHT);
         ObjectSetInteger(0, lnm, OBJPROP_SELECTABLE, false);
      }
   }

   // Pilih N sup terdekat di BAWAH bid
   double shownSup[]; ArrayResize(shownSup, 0);
   for(int i = 0; i < lCnt && ArraySize(shownSup) < MTF_MaxLines; i++)
   {
      if(pivL[i] >= bid) continue;
      bool dup = false;
      for(int k = 0; k < ArraySize(shownSup); k++)
         if(MathAbs(shownSup[k] - pivL[i]) < _Point * 10) { dup = true; break; }
      if(dup) continue;

      int idx = ArraySize(shownSup);
      ArrayResize(shownSup, idx + 1);
      shownSup[idx] = pivL[i];

      string nm = "GMZZ_MTFS_" + IntegerToString(idx);
      if(ObjectFind(0, nm) < 0)
         ObjectCreate(0, nm, OBJ_TREND, 0, pivTL[i], pivL[i], TimeCurrent(), pivL[i]);
      ObjectSetInteger(0, nm, OBJPROP_TIME, 0, pivTL[i]);
      ObjectSetDouble (0, nm, OBJPROP_PRICE, 0, pivL[i]);
      ObjectSetInteger(0, nm, OBJPROP_TIME, 1, TimeCurrent());
      ObjectSetDouble (0, nm, OBJPROP_PRICE, 1, pivL[i]);
      ObjectSetInteger(0, nm, OBJPROP_COLOR, MTF_SupColor);
      ObjectSetInteger(0, nm, OBJPROP_WIDTH, MTF_LineWidth);
      ObjectSetInteger(0, nm, OBJPROP_STYLE, MTF_LineStyle);
      ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, true);
      ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, nm, OBJPROP_BACK, false);

      if(MTF_ShowLabel)
      {
         string lnm = "GMZZ_MTFS_L" + IntegerToString(idx);
         if(ObjectFind(0, lnm) < 0)
            ObjectCreate(0, lnm, OBJ_TEXT, 0, TimeCurrent(), pivL[i]);
         else
            ObjectMove(0, lnm, 0, TimeCurrent(), pivL[i]);
         ObjectSetString(0, lnm, OBJPROP_TEXT,
                         tfStr + " S " + DoubleToString(pivL[i], _Digits));
         ObjectSetInteger(0, lnm, OBJPROP_COLOR, MTF_SupColor);
         ObjectSetInteger(0, lnm, OBJPROP_FONTSIZE, 7);
         ObjectSetString(0, lnm, OBJPROP_FONT, "Arial");
         ObjectSetInteger(0, lnm, OBJPROP_ANCHOR, ANCHOR_RIGHT);
         ObjectSetInteger(0, lnm, OBJPROP_SELECTABLE, false);
      }
   }
}

//+------------------------------------------------------------------+
//| Divergence Detector — bandingkan ZZ swing dgn RSI/MACD           |
//+------------------------------------------------------------------+
double GetDivValue(int shift)
{
   double arr[]; ArraySetAsSeries(arr, true);
   if(g_DivHandle == INVALID_HANDLE) return 0;
   if(CopyBuffer(g_DivHandle, 0, shift, 1, arr) != 1) return 0;
   return arr[0];
}

void DetectDivergence(const datetime &time[], const double &high[], const double &low[], int limit)
{
   ObjectsDeleteAll(0, "GMZZ_DIV_");
   if(!ShowDivergence) return;

   // Create handle jika belum ada
   if(g_DivHandle == INVALID_HANDLE)
   {
      if(DivergenceSource == DIV_RSI)
         g_DivHandle = iRSI(_Symbol, PERIOD_CURRENT, DivIndiPeriod, PRICE_CLOSE);
      else
         g_DivHandle = iMACD(_Symbol, PERIOD_CURRENT, DivIndiPeriod, DivMACDSlow, DivMACDSignal, PRICE_CLOSE);
      if(g_DivHandle == INVALID_HANDLE) return;
   }

   // Kumpulkan 2 swing high dan 2 swing low terakhir
   int hBars[2], lBars[2];
   double hPrices[2], lPrices[2];
   int hN = 0, lN = 0;

   for(int i = 0; i < limit && (hN < 2 || lN < 2); i++)
   {
      if(ZZHighBuffer[i] != EMPTY_VALUE && hN < 2)
      { hBars[hN] = i; hPrices[hN] = high[i]; hN++; }
      if(ZZLowBuffer[i] != EMPTY_VALUE && lN < 2)
      { lBars[lN] = i; lPrices[lN] = low[i]; lN++; }
   }

   // ── Analisa swing HIGH (bearish patterns) ──
   if(hN == 2)
   {
      double ind0 = GetDivValue(hBars[0]);   // indi di swing high terbaru
      double ind1 = GetDivValue(hBars[1]);   // indi di swing high sebelumnya

      // Regular Bearish: Price HH, Indi LH
      if(DetectRegularDiv && hPrices[0] > hPrices[1] && ind0 < ind1 && ind0 > 0 && ind1 > 0)
      {
         string nm = "GMZZ_DIV_BEAR_R";
         if(ObjectFind(0, nm) < 0)
            ObjectCreate(0, nm, OBJ_TREND, 0, time[hBars[1]], hPrices[1], time[hBars[0]], hPrices[0]);
         else
         {
            ObjectSetInteger(0, nm, OBJPROP_TIME, 0, time[hBars[1]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 0, hPrices[1]);
            ObjectSetInteger(0, nm, OBJPROP_TIME, 1, time[hBars[0]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 1, hPrices[0]);
         }
         ObjectSetInteger(0, nm, OBJPROP_COLOR, DivBearColor);
         ObjectSetInteger(0, nm, OBJPROP_WIDTH, DivLineWidth);
         ObjectSetInteger(0, nm, OBJPROP_STYLE, STYLE_SOLID);
         ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, false);
         ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);

         string lnm = "GMZZ_DIV_BEAR_R_L";
         if(ObjectFind(0, lnm) < 0)
            ObjectCreate(0, lnm, OBJ_TEXT, 0, time[hBars[0]], hPrices[0]);
         else
            ObjectMove(0, lnm, 0, time[hBars[0]], hPrices[0]);
         ObjectSetString(0, lnm, OBJPROP_TEXT, "BEAR DIV");
         ObjectSetInteger(0, lnm, OBJPROP_COLOR, DivBearColor);
         ObjectSetInteger(0, lnm, OBJPROP_FONTSIZE, 8);
         ObjectSetString(0, lnm, OBJPROP_FONT, "Arial Bold");
         ObjectSetInteger(0, lnm, OBJPROP_ANCHOR, ANCHOR_LEFT_LOWER);

         if(AlertDivergence && EnableSellAlerts &&
            TimeCurrent() - g_LastAlertDiv > 300)
         {
            g_LastAlertDiv = TimeCurrent();
            FireAlert("BEAR DIVERGENCE",
                      StringFormat("HH price=%s, LH %s",
                                   DoubleToString(hPrices[0], _Digits),
                                   DivergenceSource == DIV_RSI ? "RSI" : "MACD"));
         }
      }
      // Hidden Bearish: Price LH, Indi HH
      else if(DetectHiddenDiv && hPrices[0] < hPrices[1] && ind0 > ind1 && ind0 > 0 && ind1 > 0)
      {
         string nm = "GMZZ_DIV_BEAR_H";
         if(ObjectFind(0, nm) < 0)
            ObjectCreate(0, nm, OBJ_TREND, 0, time[hBars[1]], hPrices[1], time[hBars[0]], hPrices[0]);
         else
         {
            ObjectSetInteger(0, nm, OBJPROP_TIME, 0, time[hBars[1]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 0, hPrices[1]);
            ObjectSetInteger(0, nm, OBJPROP_TIME, 1, time[hBars[0]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 1, hPrices[0]);
         }
         ObjectSetInteger(0, nm, OBJPROP_COLOR, DivBearColor);
         ObjectSetInteger(0, nm, OBJPROP_WIDTH, DivLineWidth);
         ObjectSetInteger(0, nm, OBJPROP_STYLE, STYLE_DOT);
         ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, false);
         ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
      }
   }

   // ── Analisa swing LOW (bullish patterns) ──
   if(lN == 2)
   {
      double ind0 = GetDivValue(lBars[0]);
      double ind1 = GetDivValue(lBars[1]);

      // Regular Bullish: Price LL, Indi HL
      if(DetectRegularDiv && lPrices[0] < lPrices[1] && ind0 > ind1 && ind0 > 0 && ind1 > 0)
      {
         string nm = "GMZZ_DIV_BULL_R";
         if(ObjectFind(0, nm) < 0)
            ObjectCreate(0, nm, OBJ_TREND, 0, time[lBars[1]], lPrices[1], time[lBars[0]], lPrices[0]);
         else
         {
            ObjectSetInteger(0, nm, OBJPROP_TIME, 0, time[lBars[1]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 0, lPrices[1]);
            ObjectSetInteger(0, nm, OBJPROP_TIME, 1, time[lBars[0]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 1, lPrices[0]);
         }
         ObjectSetInteger(0, nm, OBJPROP_COLOR, DivBullColor);
         ObjectSetInteger(0, nm, OBJPROP_WIDTH, DivLineWidth);
         ObjectSetInteger(0, nm, OBJPROP_STYLE, STYLE_SOLID);
         ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, false);
         ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);

         string lnm = "GMZZ_DIV_BULL_R_L";
         if(ObjectFind(0, lnm) < 0)
            ObjectCreate(0, lnm, OBJ_TEXT, 0, time[lBars[0]], lPrices[0]);
         else
            ObjectMove(0, lnm, 0, time[lBars[0]], lPrices[0]);
         ObjectSetString(0, lnm, OBJPROP_TEXT, "BULL DIV");
         ObjectSetInteger(0, lnm, OBJPROP_COLOR, DivBullColor);
         ObjectSetInteger(0, lnm, OBJPROP_FONTSIZE, 8);
         ObjectSetString(0, lnm, OBJPROP_FONT, "Arial Bold");
         ObjectSetInteger(0, lnm, OBJPROP_ANCHOR, ANCHOR_LEFT_UPPER);

         if(AlertDivergence && EnableBuyAlerts &&
            TimeCurrent() - g_LastAlertDiv > 300)
         {
            g_LastAlertDiv = TimeCurrent();
            FireAlert("BULL DIVERGENCE",
                      StringFormat("LL price=%s, HL %s",
                                   DoubleToString(lPrices[0], _Digits),
                                   DivergenceSource == DIV_RSI ? "RSI" : "MACD"));
         }
      }
      // Hidden Bullish: Price HL, Indi LL
      else if(DetectHiddenDiv && lPrices[0] > lPrices[1] && ind0 < ind1 && ind0 > 0 && ind1 > 0)
      {
         string nm = "GMZZ_DIV_BULL_H";
         if(ObjectFind(0, nm) < 0)
            ObjectCreate(0, nm, OBJ_TREND, 0, time[lBars[1]], lPrices[1], time[lBars[0]], lPrices[0]);
         else
         {
            ObjectSetInteger(0, nm, OBJPROP_TIME, 0, time[lBars[1]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 0, lPrices[1]);
            ObjectSetInteger(0, nm, OBJPROP_TIME, 1, time[lBars[0]]);
            ObjectSetDouble (0, nm, OBJPROP_PRICE, 1, lPrices[0]);
         }
         ObjectSetInteger(0, nm, OBJPROP_COLOR, DivBullColor);
         ObjectSetInteger(0, nm, OBJPROP_WIDTH, DivLineWidth);
         ObjectSetInteger(0, nm, OBJPROP_STYLE, STYLE_DOT);
         ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, false);
         ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
      }
   }
}

//+------------------------------------------------------------------+
//| Per-tick alert check: near-line & SD zone touch                  |
//+------------------------------------------------------------------+
void CheckTickAlerts()
{
   // Early exit kalau semua alert tick-based off
   if(!AlertNearLine && !AlertSDZoneTouch) return;

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(bid <= 0) return;
   datetime now = TimeCurrent();

   // Cooldown 60 detik supaya tidak spam
   int cooldown = 60;

   // ── Near Line ──────────────────────────────────────────
   if(AlertNearLine)
   {
      double distPrice = AlertDistance * _Point;

      // Res terdekat di atas bid yang belum broken
      if(EnableSellAlerts)
      {
         double nearRes = 0;
         for(int i = 0; i < g_ResCount; i++)
         {
            if(g_ResBroken[i]) continue;
            double lv = g_ResLevels[i];
            if(lv > bid && (nearRes == 0 || lv < nearRes)) nearRes = lv;
         }
         if(nearRes > 0 && (nearRes - bid) <= distPrice &&
            (now - g_LastAlertNearRes) > cooldown)
         {
            g_LastAlertNearRes = now;
            FireAlert("NEAR RESISTANCE",
                      StringFormat("Price %s mendekati Res %s (jarak %d pts)",
                                   DoubleToString(bid, _Digits),
                                   DoubleToString(nearRes, _Digits),
                                   (int)((nearRes - bid) / _Point)));
         }
      }

      // Sup terdekat di bawah bid yang belum broken
      if(EnableBuyAlerts)
      {
         double nearSup = 0;
         for(int i = 0; i < g_SupCount; i++)
         {
            if(g_SupBroken[i]) continue;
            double lv = g_SupLevels[i];
            if(lv < bid && (nearSup == 0 || lv > nearSup)) nearSup = lv;
         }
         if(nearSup > 0 && (bid - nearSup) <= distPrice &&
            (now - g_LastAlertNearSup) > cooldown)
         {
            g_LastAlertNearSup = now;
            FireAlert("NEAR SUPPORT",
                      StringFormat("Price %s mendekati Sup %s (jarak %d pts)",
                                   DoubleToString(bid, _Digits),
                                   DoubleToString(nearSup, _Digits),
                                   (int)((bid - nearSup) / _Point)));
         }
      }
   }

   // ── SD Zone touch (iterasi chart objects) ──────────────
   if(AlertSDZoneTouch && (now - g_LastAlertSDZone) > cooldown)
   {
      int total = ObjectsTotal(0, -1, OBJ_RECTANGLE);
      for(int k = 0; k < total; k++)
      {
         string nm = ObjectName(0, k, -1, OBJ_RECTANGLE);
         if(StringFind(nm, "GMZZ_SDZ_") != 0) continue;

         double p1 = ObjectGetDouble(0, nm, OBJPROP_PRICE, 0);
         double p2 = ObjectGetDouble(0, nm, OBJPROP_PRICE, 1);
         double zTop = MathMax(p1, p2);
         double zBot = MathMin(p1, p2);
         if(bid >= zBot && bid <= zTop)
         {
            // Cek apakah zona demand (buy) atau supply (sell) via warna
            color zc = (color)ObjectGetInteger(0, nm, OBJPROP_COLOR);
            bool isDemand = (zc == DBRColor || zc == RBRColor);
            bool isSupply = (zc == RBDColor || zc == DBDColor);

            if((isDemand && EnableBuyAlerts) || (isSupply && EnableSellAlerts))
            {
               g_LastAlertSDZone = now;
               FireAlert("SD ZONE TOUCH",
                         StringFormat("Price %s masuk zona [%s - %s]",
                                      DoubleToString(bid, _Digits),
                                      DoubleToString(zBot, _Digits),
                                      DoubleToString(zTop, _Digits)));
               break;
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| OnCalculate — Standard ZigZag state machine                      |
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double   &open[],
                const double   &high[],
                const double   &low[],
                const double   &close[],
                const long     &tick_volume[],
                const long     &volume[],
                const int      &spread[])
{
   int _gmrfxLic = GmrfxZZ_OnCalculateLicenseGate(prev_calculated);
   if(_gmrfxLic >= 0)
      return _gmrfxLic;

   if(rates_total < ZZ_Depth + ZZ_Backstep) return 0;

   ArraySetAsSeries(ZZHighBuffer,    true);
   ArraySetAsSeries(ZZLowBuffer,     true);
   ArraySetAsSeries(ZZLineBuffer,    true);
   ArraySetAsSeries(BreakUpBuffer,   true);
   ArraySetAsSeries(BreakDownBuffer, true);
   ArraySetAsSeries(high,  true);
   ArraySetAsSeries(low,   true);
   ArraySetAsSeries(close, true);
   ArraySetAsSeries(open,  true);
   ArraySetAsSeries(time,  true);

   // ── Throttled updates (kurangi beban per tick) ──
   datetime _now = TimeCurrent();

   // Timezone: cek tiap 60 detik (cukup utk DST)
   static datetime lastTZ = 0;
   if(_now - lastTZ >= 60) { UpdateBrokerTimezone(); lastTZ = _now; }

   // Enforce chart foreground = false tiap 60 detik (MT5 kadang reset saat template reload)
   static datetime lastFgCheck = 0;
   if(ForceChartBackground && _now - lastFgCheck >= 60)
   {
      if(ChartGetInteger(0, CHART_FOREGROUND) != 0)
         ChartSetInteger(0, CHART_FOREGROUND, false);
      lastFgCheck = _now;
   }

   // Daily candles: redraw tiap 30 detik (range H/L bisa berubah intraday)
   if(_now - g_LastDailyDraw >= 30) { DrawDailyCandles(); g_LastDailyDraw = _now; }

   // Sessions: full redraw hanya saat day berubah; label status tiap 60 detik
   MqlDateTime _dt;
   TimeToStruct(_now, _dt);
   int today = _dt.day_of_year;
   if(today != g_LastSessionDay || _now - g_LastSessionDraw >= 60)
   {
      DrawSessions();
      g_LastSessionDay = today;
      g_LastSessionDraw = _now;
   }

   // Candle timer: update tiap detik (bukan tiap tick bisa puluhan/s)
   if(_now - g_LastTimerUpdate >= 1) { DrawCandleTimer(); g_LastTimerUpdate = _now; }

   // Alert check: tiap 3 detik cukup (cooldown-nya 60 detik juga)
   if(_now - g_LastTickAlert >= 3) { CheckTickAlerts(); g_LastTickAlert = _now; }

   // Dashboard: render tiap 1 detik
   if(_now - g_LastDashUpdate >= 1) { DrawDashboard(); g_LastDashUpdate = _now; }

   // Anti flicker: ZZ + lines hanya hitung ulang saat bar baru
   static int lastBars = 0;
   if(rates_total == lastBars && prev_calculated > 0) return rates_total;
   lastBars = rates_total;

   int limit = MathMin(rates_total - 1, MaxBars);
   ArrayInitialize(ZZHighBuffer,    EMPTY_VALUE);
   ArrayInitialize(ZZLowBuffer,     EMPTY_VALUE);
   ArrayInitialize(ZZLineBuffer,    EMPTY_VALUE);
   ArrayInitialize(BreakUpBuffer,   EMPTY_VALUE);
   ArrayInitialize(BreakDownBuffer, EMPTY_VALUE);
   g_ResCount = 0;
   g_SupCount = 0;

   // ── Standard ZigZag State Machine ─────────────────────────
   // State: 0=cari awal, 1=terakhir high (cari low), -1=terakhir low (cari high)
   int state = 0;
   int lastHighBar = -1, lastLowBar = -1;
   double lastHighPrice = 0, lastLowPrice = 0;

   for(int i = limit; i >= 0; i--)
   {
      // Cari local high & low dalam window Depth
      int hBar = HighestBar(high, i, ZZ_Depth, rates_total);
      int lBar = LowestBar(low,   i, ZZ_Depth, rates_total);

      // Hanya proses jika bar saat ini adalah extremum
      if(hBar != i && lBar != i) continue;

      bool isLocalHigh = (hBar == i);
      bool isLocalLow  = (lBar == i);

      if(state == 0)
      {
         // Inisialisasi: cari swing pertama
         if(isLocalHigh)
         {
            lastHighBar   = i;
            lastHighPrice = high[i];
            state = 1;
         }
         else if(isLocalLow)
         {
            lastLowBar   = i;
            lastLowPrice = low[i];
            state = -1;
         }
         continue;
      }

      if(state == 1) // Terakhir adalah HIGH, cari LOW
      {
         if(isLocalHigh && high[i] > lastHighPrice)
         {
            // Higher high → update posisi high terakhir
            ZZHighBuffer[lastHighBar] = EMPTY_VALUE;
            ZZLineBuffer[lastHighBar] = EMPTY_VALUE;
            lastHighBar   = i;
            lastHighPrice = high[i];
         }
         else if(isLocalLow)
         {
            double swing = lastHighPrice - low[i];
            if(swing >= ZZ_Deviation * _Point &&
               MathAbs(lastHighBar - i) >= ZZ_Backstep)
            {
               // Konfirmasi: set HIGH sebelumnya
               ZZHighBuffer[lastHighBar] = lastHighPrice;
               ZZLineBuffer[lastHighBar] = lastHighPrice;
               AddResistanceLevel(lastHighPrice, time[lastHighBar]);

               // Set LOW baru
               lastLowBar   = i;
               lastLowPrice = low[i];
               state = -1;
            }
         }
      }
      else if(state == -1) // Terakhir adalah LOW, cari HIGH
      {
         if(isLocalLow && low[i] < lastLowPrice)
         {
            // Lower low → update posisi low terakhir
            ZZLowBuffer[lastLowBar] = EMPTY_VALUE;
            ZZLineBuffer[lastLowBar] = EMPTY_VALUE;
            lastLowBar   = i;
            lastLowPrice = low[i];
         }
         else if(isLocalHigh)
         {
            double swing = high[i] - lastLowPrice;
            if(swing >= ZZ_Deviation * _Point &&
               MathAbs(lastLowBar - i) >= ZZ_Backstep)
            {
               // Konfirmasi: set LOW sebelumnya
               ZZLowBuffer[lastLowBar] = lastLowPrice;
               ZZLineBuffer[lastLowBar] = lastLowPrice;
               AddSupportLevel(lastLowPrice, time[lastLowBar]);

               // Set HIGH baru
               lastHighBar   = i;
               lastHighPrice = high[i];
               state = 1;
            }
         }
      }
   }

   // Set swing terakhir yang belum di-set
   if(state == 1 && lastHighBar >= 0)
   {
      ZZHighBuffer[lastHighBar] = lastHighPrice;
      ZZLineBuffer[lastHighBar] = lastHighPrice;
      AddResistanceLevel(lastHighPrice);
   }
   else if(state == -1 && lastLowBar >= 0)
   {
      ZZLowBuffer[lastLowBar] = lastLowPrice;
      ZZLineBuffer[lastLowBar] = lastLowPrice;
      AddSupportLevel(lastLowPrice);
   }

   // ── Alert: ZZ direction change ───────────────────────────
   if(AlertZZDirection && state != 0 && state != g_LastZZState)
   {
      double curSwing = (state == 1) ? lastHighPrice : lastLowPrice;
      if(g_LastZZState != 0 && curSwing != g_LastZZSwingPrice)
      {
         bool bullish = (state == 1);
         if((bullish && EnableBuyAlerts) || (!bullish && EnableSellAlerts))
         {
            FireAlert(bullish ? "ZZ TURN UP" : "ZZ TURN DOWN",
                      StringFormat("Swing %s baru @ %s",
                                   bullish ? "HIGH" : "LOW",
                                   DoubleToString(curSwing, _Digits)));
         }
      }
      g_LastZZState = state;
      g_LastZZSwingPrice = curSwing;
   }

   // ── Label nomor swing (semua swing, penomoran gabungan) ────
   ObjectsDeleteAll(0, "GMZZ_SN_");
   if(ShowSwingNumbers)
   {
      int swCnt = 0;  // counter gabungan untuk semua swing
      double atrVal = 0;
      int atrH = iATR(NULL, PERIOD_CURRENT, 14);
      if(atrH != INVALID_HANDLE)
      {
         double atrArr[]; ArraySetAsSeries(atrArr, true);
         if(CopyBuffer(atrH, 0, 0, 1, atrArr) == 1) atrVal = atrArr[0];
         IndicatorRelease(atrH);
      }
      double offset = (atrVal > 0) ? atrVal * 0.3 : _Point * 50;

      for(int i = 0; i < limit; i++)
      {
         bool isHigh = (ZZHighBuffer[i] != EMPTY_VALUE);
         bool isLow  = (ZZLowBuffer[i]  != EMPTY_VALUE);
         if(!isHigh && !isLow) continue;

         // Jika bar ini punya swing high
         if(isHigh)
         {
            swCnt++;
            string nm = "GMZZ_SN_" + IntegerToString(swCnt);
            if(ObjectFind(0, nm) < 0)
               ObjectCreate(0, nm, OBJ_TEXT, 0, time[i], high[i] + offset);
            else
               ObjectMove(0, nm, 0, time[i], high[i] + offset);
            ObjectSetString(0, nm, OBJPROP_TEXT, IntegerToString(swCnt));
            ObjectSetInteger(0, nm, OBJPROP_COLOR, clrRed);
            ObjectSetInteger(0, nm, OBJPROP_FONTSIZE, 8);
            ObjectSetString(0, nm, OBJPROP_FONT, "Arial Bold");
            ObjectSetInteger(0, nm, OBJPROP_ANCHOR, ANCHOR_LOWER);
            ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
         }

         // Jika bar ini punya swing low
         if(isLow)
         {
            swCnt++;
            string nm = "GMZZ_SN_" + IntegerToString(swCnt);
            if(ObjectFind(0, nm) < 0)
               ObjectCreate(0, nm, OBJ_TEXT, 0, time[i], low[i] - offset);
            else
               ObjectMove(0, nm, 0, time[i], low[i] - offset);
            ObjectSetString(0, nm, OBJPROP_TEXT, IntegerToString(swCnt));
            ObjectSetInteger(0, nm, OBJPROP_COLOR, clrDarkBlue);
            ObjectSetInteger(0, nm, OBJPROP_FONTSIZE, 8);
            ObjectSetString(0, nm, OBJPROP_FONT, "Arial Bold");
            ObjectSetInteger(0, nm, OBJPROP_ANCHOR, ANCHOR_UPPER);
            ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
         }
      }
   }

   // ── Supply/Demand Zones (DBR/RBD/RBR/DBD) ─────────────
   ObjectsDeleteAll(0, "GMZZ_SDZ_");
   ObjectsDeleteAll(0, "GMZZ_SDL_");
   ObjectsDeleteAll(0, "GMZZ_VP_");
   if(ShowSDZones)
   {
      // Kumpulkan semua swing secara kronologis (terlama dulu)
      double swPrice[];
      int    swBar[];
      bool   swIsH[];
      int    swN = 0;

      ArrayResize(swPrice, limit);
      ArrayResize(swBar, limit);
      ArrayResize(swIsH, limit);

      for(int i = limit - 1; i >= 0; i--)
      {
         if(ZZHighBuffer[i] != EMPTY_VALUE)
         {
            swPrice[swN] = high[i]; swBar[swN] = i; swIsH[swN] = true; swN++;
         }
         else if(ZZLowBuffer[i] != EMPTY_VALUE)
         {
            swPrice[swN] = low[i]; swBar[swN] = i; swIsH[swN] = false; swN++;
         }
      }
      ArrayResize(swPrice, swN);
      ArrayResize(swBar, swN);
      ArrayResize(swIsH, swN);

      int zCnt = 0;
      datetime tNow = time[0];

      // ---- 4-point continuation: RBR, DBD ----
      // Scan dari terbaru ke terlama
      for(int i = swN - 4; i >= 0 && zCnt < MaxSDZones; i--)
      {
         // Kronologis: P1=[i], P2=[i+1], P3=[i+2], P4=[i+3]
         double leg1 = MathAbs(swPrice[i+1] - swPrice[i]);
         double base = MathAbs(swPrice[i+2] - swPrice[i+1]);
         double leg3 = MathAbs(swPrice[i+3] - swPrice[i+2]);

         double minLeg = MathMin(leg1, leg3);
         if(minLeg <= 0 || base > minLeg * BaseMaxRatio) continue;

         string basePat;
         color zClr;
         bool isSupply; // true = supply zone (DBD), false = demand zone (RBR)

         if(swIsH[i]) // H→L→H→L: drop-base-drop = supply
         { basePat = "DBD"; zClr = DBDColor; isSupply = true; }
         else          // L→H→L→H: rally-base-rally = demand
         { basePat = "RBR"; zClr = RBRColor; isSupply = false; }

         double zTop = MathMax(swPrice[i+1], swPrice[i+2]);
         double zBot = MathMin(swPrice[i+1], swPrice[i+2]);

         // Break detection: scan bar setelah pattern selesai
         // 0=original, 1=become (flip), 2=invalidated (broken lagi)
         int zStatus = 0;
         int checkFrom = swBar[i+3] - 1;
         for(int b = checkFrom; b >= 0; b--)
         {
            if(zStatus == 0)
            {
               if(isSupply && close[b] > zTop) zStatus = 1;   // supply broken up → demand
               else if(!isSupply && close[b] < zBot) zStatus = 1; // demand broken down → supply
            }
            else if(zStatus == 1)
            {
               if(isSupply && close[b] < zBot) { zStatus = 2; break; }   // demand broken lagi → hapus
               else if(!isSupply && close[b] > zTop) { zStatus = 2; break; } // supply broken lagi → hapus
            }
         }

         if(zStatus == 2) continue; // zona sudah invalid, jangan gambar

         string pat;
         if(zStatus == 1)
            pat = basePat + " BECOME " + (isSupply ? "DEMAND" : "SUPPLY") + " ZONE";
         else
            pat = basePat + " ZONE";

         datetime t1 = time[swBar[i+1]];
         datetime t2 = ExtendSDZone ? tNow : time[swBar[i+2]];

         string zn = "GMZZ_SDZ_" + IntegerToString(zCnt);
         ObjectCreate(0, zn, OBJ_RECTANGLE, 0, t1, zTop, t2, zBot);
         ObjectSetInteger(0, zn, OBJPROP_COLOR, zClr);
         ObjectSetInteger(0, zn, OBJPROP_FILL, true);
         ObjectSetInteger(0, zn, OBJPROP_BACK, true);
         ObjectSetInteger(0, zn, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, zn, OBJPROP_HIDDEN, true);

         if(ShowSDLabel)
         {
            string ln = "GMZZ_SDL_" + IntegerToString(zCnt);
            datetime tMid = (datetime)(((long)t1 + (long)t2) / 2);
            double pMid = (zTop + zBot) / 2.0;
            ObjectCreate(0, ln, OBJ_TEXT, 0, tMid, pMid);
            ObjectSetString(0, ln, OBJPROP_TEXT, pat);
            ObjectSetInteger(0, ln, OBJPROP_COLOR, clrBlack);
            ObjectSetInteger(0, ln, OBJPROP_FONTSIZE, 8);
            ObjectSetString(0, ln, OBJPROP_FONT, "Arial Bold");
            ObjectSetInteger(0, ln, OBJPROP_ANCHOR, ANCHOR_CENTER);
            ObjectSetInteger(0, ln, OBJPROP_SELECTABLE, false);
         }

         // Order Block line: garis horizontal di boundary asal (bar P2 atau P3)
         if(ShowOrderBlock)
         {
            double obLevel = isSupply ? zTop : zBot;  // supply=top, demand=bot
            string obn = "GMZZ_SDZ_OB_" + IntegerToString(zCnt);
            if(ObjectFind(0, obn) < 0)
               ObjectCreate(0, obn, OBJ_TREND, 0, t1, obLevel, t2, obLevel);
            else
            {
               ObjectSetInteger(0, obn, OBJPROP_TIME,  0, t1);
               ObjectSetDouble (0, obn, OBJPROP_PRICE, 0, obLevel);
               ObjectSetInteger(0, obn, OBJPROP_TIME,  1, t2);
               ObjectSetDouble (0, obn, OBJPROP_PRICE, 1, obLevel);
            }
            ObjectSetInteger(0, obn, OBJPROP_COLOR, OBLineColor);
            ObjectSetInteger(0, obn, OBJPROP_WIDTH, OBLineWidth);
            ObjectSetInteger(0, obn, OBJPROP_STYLE, STYLE_SOLID);
            ObjectSetInteger(0, obn, OBJPROP_RAY_RIGHT, false);
            ObjectSetInteger(0, obn, OBJPROP_SELECTABLE, false);
            ObjectSetInteger(0, obn, OBJPROP_HIDDEN, true);
            ObjectSetInteger(0, obn, OBJPROP_BACK, false);
         }

         // Volume Profile di dalam zone (4-point pattern)
         DrawVolumeProfileInZone(zn, zCnt, t1, t2, zTop, zBot,
                                  high, low, time, tick_volume, volume, rates_total);
         zCnt++;
      }

      // ---- 5-point reversal: DBR, RBD ----
      for(int i = swN - 5; i >= 0 && zCnt < MaxSDZones; i--)
      {
         double leg1 = MathAbs(swPrice[i+1] - swPrice[i]);
         double b1   = MathAbs(swPrice[i+2] - swPrice[i+1]);
         double b2   = MathAbs(swPrice[i+3] - swPrice[i+2]);
         double leg5 = MathAbs(swPrice[i+4] - swPrice[i+3]);

         double baseMax = MathMax(b1, b2);
         double minLeg  = MathMin(leg1, leg5);
         if(minLeg <= 0 || baseMax > minLeg * BaseMaxRatio) continue;

         // Validasi breakout: swing 1 (P5) harus break swing 3 (P3)
         // DBR (H→L→H→L→H): P5(H terbaru) > P3(H di base) → rally break base resistance
         // RBD (L→H→L→H→L): P5(L terbaru) < P3(L di base) → drop break base support
         if(swIsH[i]) // DBR: cek P5(H) > P3(H)
         { if(swPrice[i+4] <= swPrice[i+2]) continue; }
         else          // RBD: cek P5(L) < P3(L)
         { if(swPrice[i+4] >= swPrice[i+2]) continue; }

         string basePat;
         color zClr;
         bool isSupply; // true = supply zone (RBD), false = demand zone (DBR)

         if(swIsH[i]) // H→L→H→L→H: drop-base-rally = demand
         { basePat = "DBR"; zClr = DBRColor; isSupply = false; }
         else          // L→H→L→H→L: rally-base-drop = supply
         { basePat = "RBD"; zClr = RBDColor; isSupply = true; }

         // Base zone spans P2 sampai P4
         double zTop = MathMax(MathMax(swPrice[i+1], swPrice[i+2]), swPrice[i+3]);
         double zBot = MathMin(MathMin(swPrice[i+1], swPrice[i+2]), swPrice[i+3]);

         // Break detection
         int zStatus = 0;
         int checkFrom = swBar[i+4] - 1;
         for(int b = checkFrom; b >= 0; b--)
         {
            if(zStatus == 0)
            {
               if(isSupply && close[b] > zTop) zStatus = 1;   // supply broken up → demand
               else if(!isSupply && close[b] < zBot) zStatus = 1; // demand broken down → supply
            }
            else if(zStatus == 1)
            {
               if(isSupply && close[b] < zBot) { zStatus = 2; break; }   // demand broken lagi → hapus
               else if(!isSupply && close[b] > zTop) { zStatus = 2; break; } // supply broken lagi → hapus
            }
         }

         if(zStatus == 2) continue; // zona sudah invalid, jangan gambar

         string pat;
         if(zStatus == 1)
            pat = basePat + " BECOME " + (isSupply ? "DEMAND" : "SUPPLY") + " ZONE";
         else
            pat = basePat + " ZONE";

         datetime t1 = time[swBar[i+1]];
         datetime t2 = ExtendSDZone ? tNow : time[swBar[i+3]];

         string zn = "GMZZ_SDZ_" + IntegerToString(zCnt);
         ObjectCreate(0, zn, OBJ_RECTANGLE, 0, t1, zTop, t2, zBot);
         ObjectSetInteger(0, zn, OBJPROP_COLOR, zClr);
         ObjectSetInteger(0, zn, OBJPROP_FILL, true);
         ObjectSetInteger(0, zn, OBJPROP_BACK, true);
         ObjectSetInteger(0, zn, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, zn, OBJPROP_HIDDEN, true);

         if(ShowSDLabel)
         {
            string ln = "GMZZ_SDL_" + IntegerToString(zCnt);
            datetime tMid = (datetime)(((long)t1 + (long)t2) / 2);
            double pMid = (zTop + zBot) / 2.0;
            ObjectCreate(0, ln, OBJ_TEXT, 0, tMid, pMid);
            ObjectSetString(0, ln, OBJPROP_TEXT, pat);
            ObjectSetInteger(0, ln, OBJPROP_COLOR, clrBlack);
            ObjectSetInteger(0, ln, OBJPROP_FONTSIZE, 8);
            ObjectSetString(0, ln, OBJPROP_FONT, "Arial Bold");
            ObjectSetInteger(0, ln, OBJPROP_ANCHOR, ANCHOR_CENTER);
            ObjectSetInteger(0, ln, OBJPROP_SELECTABLE, false);
         }

         // Order Block line untuk 5-point reversal
         if(ShowOrderBlock)
         {
            double obLevel = isSupply ? zTop : zBot;
            string obn = "GMZZ_SDZ_OB_" + IntegerToString(zCnt);
            if(ObjectFind(0, obn) < 0)
               ObjectCreate(0, obn, OBJ_TREND, 0, t1, obLevel, t2, obLevel);
            else
            {
               ObjectSetInteger(0, obn, OBJPROP_TIME,  0, t1);
               ObjectSetDouble (0, obn, OBJPROP_PRICE, 0, obLevel);
               ObjectSetInteger(0, obn, OBJPROP_TIME,  1, t2);
               ObjectSetDouble (0, obn, OBJPROP_PRICE, 1, obLevel);
            }
            ObjectSetInteger(0, obn, OBJPROP_COLOR, OBLineColor);
            ObjectSetInteger(0, obn, OBJPROP_WIDTH, OBLineWidth);
            ObjectSetInteger(0, obn, OBJPROP_STYLE, STYLE_SOLID);
            ObjectSetInteger(0, obn, OBJPROP_RAY_RIGHT, false);
            ObjectSetInteger(0, obn, OBJPROP_SELECTABLE, false);
            ObjectSetInteger(0, obn, OBJPROP_HIDDEN, true);
            ObjectSetInteger(0, obn, OBJPROP_BACK, false);
         }

         // Volume Profile di dalam zone (5-point pattern)
         DrawVolumeProfileInZone(zn, zCnt, t1, t2, zTop, zBot,
                                  high, low, time, tick_volume, volume, rates_total);
         zCnt++;
      }
   }

   // ── Breakout detection: scan historis untuk cari break time ─
   if(ShowHLines && rates_total > 1)
   {
      // Scan setiap level: cari bar pertama yang menembus
      // Hanya 1 arrow per bar (cek duplikat)
      for(int i = 0; i < g_ResCount; i++)
      {
         if(g_ResBroken[i]) continue;
         double level = g_ResLevels[i];
         for(int b = limit; b >= 1; b--)
         {
            if(time[b] <= g_ResTime[i]) continue;
            if(close[b] > level)
            {
               g_ResBroken[i] = true;
               g_ResBreakTime[i] = time[b];
               if(ShowBreakArrows && BreakUpBuffer[b] == EMPTY_VALUE)
                  BreakUpBuffer[b] = low[b] - (high[b] - low[b]) * 0.5;

               // Alert: resistance broken (hanya utk break di bar baru = b==1)
               if(AlertLineBreakout && EnableBuyAlerts && b == 1 &&
                  time[b] > g_LastAlertResBreak)
               {
                  g_LastAlertResBreak = time[b];
                  FireAlert("BREAKOUT UP",
                            StringFormat("Resistance %s tertembus @ %s",
                                         DoubleToString(level, _Digits),
                                         DoubleToString(close[b], _Digits)));
               }
               break;
            }
         }
      }

      for(int i = 0; i < g_SupCount; i++)
      {
         if(g_SupBroken[i]) continue;
         double level = g_SupLevels[i];
         for(int b = limit; b >= 1; b--)
         {
            if(time[b] <= g_SupTime[i]) continue;
            if(close[b] < level)
            {
               g_SupBroken[i] = true;
               g_SupBreakTime[i] = time[b];
               if(ShowBreakArrows && BreakDownBuffer[b] == EMPTY_VALUE)
                  BreakDownBuffer[b] = high[b] + (high[b] - low[b]) * 0.5;

               // Alert: support broken
               if(AlertLineBreakout && EnableSellAlerts && b == 1 &&
                  time[b] > g_LastAlertSupBreak)
               {
                  g_LastAlertSupBreak = time[b];
                  FireAlert("BREAKOUT DOWN",
                            StringFormat("Support %s tertembus @ %s",
                                         DoubleToString(level, _Digits),
                                         DoubleToString(close[b], _Digits)));
               }
               break;
            }
         }
      }

      // ── Auto Fibo saat breakout (hanya 1 terbaru per arah) ──
      ObjectsDeleteAll(0, "GMZZ_FIB_");
      if(ShowAutoFibo)
      {
         // --- Cari break RESISTANCE terbaru ---
         int latestResIdx = -1;
         datetime latestResT = 0;
         for(int i = 0; i < g_ResCount; i++)
         {
            if(g_ResBroken[i] && g_ResBreakTime[i] > latestResT)
            { latestResT = g_ResBreakTime[i]; latestResIdx = i; }
         }

         // --- Cari break SUPPORT terbaru (dihitung lebih dulu utk ray) ---
         int latestSupIdx = -1;
         datetime latestSupT = 0;
         for(int i = 0; i < g_SupCount; i++)
         {
            if(g_SupBroken[i] && g_SupBreakTime[i] > latestSupT)
            { latestSupT = g_SupBreakTime[i]; latestSupIdx = i; }
         }

         if(latestResIdx >= 0)
         {
            // Cari bar break (bar dengan arrow breakout)
            int bBar = -1;
            for(int b = 0; b < limit; b++)
               if(time[b] == g_ResBreakTime[latestResIdx]) { bBar = b; break; }

            if(bBar >= 0)
            {
               // Cari swing low SEBELUM bar break
               int prevLowBar = -1;
               for(int b = bBar + 1; b < limit; b++)
                  if(ZZLowBuffer[b] != EMPTY_VALUE) { prevLowBar = b; break; }

               if(prevLowBar >= 0)
               {
                  // Narik dari bar break/arrow (100%) → previous LOW (0%)
                  DrawFibo("GMZZ_FIB_UP",
                          time[bBar], high[bBar],
                          time[prevLowBar], low[prevLowBar],
                          FiboUpColor,
                          (latestResT >= latestSupT ? FiboRayRight : false));
               }
            }
         }

         if(latestSupIdx >= 0)
         {
            int bBar = -1;
            for(int b = 0; b < limit; b++)
               if(time[b] == g_SupBreakTime[latestSupIdx]) { bBar = b; break; }

            if(bBar >= 0)
            {
               // Swing high SEBELUM bar break
               int prevHighBar = -1;
               for(int b = bBar + 1; b < limit; b++)
                  if(ZZHighBuffer[b] != EMPTY_VALUE) { prevHighBar = b; break; }

               if(prevHighBar >= 0)
               {
                  // Narik dari bar break/arrow (100%) → previous HIGH (0%)
                  DrawFibo("GMZZ_FIB_DN",
                          time[bBar], low[bBar],
                          time[prevHighBar], high[prevHighBar],
                          FiboDownColor,
                          (latestSupT > latestResT ? FiboRayRight : false));
               }
            }
         }
      }

      double cl = close[1];
      datetime tm = time[1];

      // Cari level terpenting: terdekat di atas (nearest res) dan di bawah (nearest sup)
      // + overall highest dan lowest yang belum broken
      double nearestRes = 0, nearestSup = 0;
      double highestRes = 0, lowestSup = 0;

      for(int i = 0; i < g_ResCount; i++)
      {
         if(g_ResBroken[i]) continue;
         double lv = g_ResLevels[i];
         if(lv > cl)
         {
            if(nearestRes == 0 || lv < nearestRes) nearestRes = lv;
            if(lv > highestRes) highestRes = lv;
         }
      }
      for(int i = 0; i < g_SupCount; i++)
      {
         if(g_SupBroken[i]) continue;
         double lv = g_SupLevels[i];
         if(lv < cl)
         {
            if(nearestSup == 0 || lv > nearestSup) nearestSup = lv;
            if(lowestSup == 0 || lv < lowestSup) lowestSup = lv;
         }
      }

      // Gambar horizontal lines
      ObjectsDeleteAll(0, "GMZZ_R_");
      ObjectsDeleteAll(0, "GMZZ_S_");
      ObjectsDeleteAll(0, "GMZZ_RP_");
      ObjectsDeleteAll(0, "GMZZ_SP_");
      ObjectsDeleteAll(0, "GMZZ_BR_");
      ObjectsDeleteAll(0, "GMZZ_BS_");

      // --- Resistance ---
      for(int i = 0; i < g_ResCount; i++)
      {
         string name = "GMZZ_R_" + IntegerToString(i);
         double lv = g_ResLevels[i];

         if(g_ResBroken[i])
         {
            // Broken: garis sampai candle yang merusak
            if(ShowBrokenLines && g_ResBreakTime[i] > 0)
               DrawHLine(name, lv, BrokenColor, 1, BrokenLineStyle,
                         g_ResTime[i], g_ResBreakTime[i]);
         }
         else
         {
            bool isKey = (MathAbs(lv - nearestRes) < _Point || MathAbs(lv - highestRes) < _Point);
            if(isKey)
            {
               // Key level: solid tebal + label harga
               DrawHLine(name, lv, ResistanceColor, LineWidth + 1, STYLE_SOLID, g_ResTime[i], tm);
               if(ShowPrice)
               {
                  string lbl = "GMZZ_RP_" + IntegerToString(i);
                  string txt = DoubleToString(lv, _Digits);
                  if(ShowTouches) txt += " (" + IntegerToString(g_ResTouches[i]) + ")";
                  DrawPriceLabel(lbl, lv, tm, txt, ResistanceColor);
               }
            }
            else
            {
               // Swing lemah: garis halus sampai current
               DrawHLine(name, lv, ResistanceColor, 1, WeakStyle, g_ResTime[i], tm);
            }
         }
      }

      // --- Support ---
      for(int i = 0; i < g_SupCount; i++)
      {
         string name = "GMZZ_S_" + IntegerToString(i);
         double lv = g_SupLevels[i];

         if(g_SupBroken[i])
         {
            // Broken: garis sampai candle yang merusak
            if(ShowBrokenLines && g_SupBreakTime[i] > 0)
               DrawHLine(name, lv, BrokenColor, 1, BrokenLineStyle,
                         g_SupTime[i], g_SupBreakTime[i]);
         }
         else
         {
            bool isKey = (MathAbs(lv - nearestSup) < _Point || MathAbs(lv - lowestSup) < _Point);
            if(isKey)
            {
               DrawHLine(name, lv, SupportColor, LineWidth + 1, STYLE_SOLID, g_SupTime[i], tm);
               if(ShowPrice)
               {
                  string lbl = "GMZZ_SP_" + IntegerToString(i);
                  string txt = DoubleToString(lv, _Digits);
                  if(ShowTouches) txt += " (" + IntegerToString(g_SupTouches[i]) + ")";
                  DrawPriceLabel(lbl, lv, tm, txt, SupportColor);
               }
            }
            else
            {
               DrawHLine(name, lv, SupportColor, 1, WeakStyle, g_SupTime[i], tm);
            }
         }
      }
   }

   // ── Adaptive Trend Lines ──────────────────────────────────
   ObjectsDeleteAll(0, "GMZZ_ATL_");
   if(ShowAdaptiveTL)
   {
      double resFirst = 0, resLast = 0, supFirst = 0, supLast = 0;
      int resFirstBar = 0, resLastBar = 0, supFirstBar = 0, supLastBar = 0;
      bool resOk = false, supOk = false;

      if(AdaptiveTLSource == ATL_LINREG)
      {
         // ── Mode 3: Linear Regression (trend line 2 titik) ──
         int per = MathMax(5, AdaptiveTLPeriod);
         if(per + 1 < limit)
         {
            resFirstBar = per - 1;  resLastBar = 0;
            supFirstBar = per - 1;  supLastBar = 0;

            double sumX=0, sumYH=0, sumXYH=0, sumX2=0;
            double sumYL=0, sumXYL=0;
            for(int k = 0; k < per; k++)
            {
               double x = (double)k;
               sumX += x; sumX2 += x*x;
               sumYH += high[k]; sumXYH += x * high[k];
               sumYL += low[k];  sumXYL += x * low[k];
            }
            double denom = per * sumX2 - sumX * sumX;
            if(denom != 0)
            {
               double slopeH = (per * sumXYH - sumX * sumYH) / denom;
               double intcH  = (sumYH - slopeH * sumX) / per;
               double slopeL = (per * sumXYL - sumX * sumYL) / denom;
               double intcL  = (sumYL - slopeL * sumX) / per;

               double sumErrH = 0, sumErrL = 0;
               for(int k = 0; k < per; k++)
               {
                  double eH = high[k] - (intcH + slopeH * k);
                  double eL = low[k]  - (intcL + slopeL * k);
                  sumErrH += eH * eH;
                  sumErrL += eL * eL;
               }
               double sdH = MathSqrt(sumErrH / per);
               double sdL = MathSqrt(sumErrL / per);

               resFirst = intcH + slopeH * (per - 1) + AdaptiveTLDeviation * sdH;
               resLast  = intcH + AdaptiveTLDeviation * sdH;
               supFirst = intcL + slopeL * (per - 1) - AdaptiveTLDeviation * sdL;
               supLast  = intcL - AdaptiveTLDeviation * sdL;
               resOk = true; supOk = true;
            }
         }
      }
      else
      {
         // ── Mode 1 & 2: Swing ZZ / High-Low Pivot ──
         int nPts = MathMax(2, MathMin(AdaptiveTLSwings, 10));
         int hBars[];  ArrayResize(hBars, nPts);  int hCnt = 0;
         int lBars[];  ArrayResize(lBars, nPts);  int lCnt = 0;

         if(AdaptiveTLSource == ATL_ZZ_SWING)
         {
            for(int i = 0; i < limit && (hCnt < nPts || lCnt < nPts); i++)
            {
               if(ZZHighBuffer[i] != EMPTY_VALUE && hCnt < nPts) { hBars[hCnt] = i; hCnt++; }
               if(ZZLowBuffer[i]  != EMPTY_VALUE && lCnt < nPts) { lBars[lCnt] = i; lCnt++; }
            }
         }
         else // ATL_HL_PRICE
         {
            int per = MathMax(3, AdaptiveTLPeriod);
            int scanMax = MathMin(limit, 500);
            for(int i = per; i < scanMax - per && (hCnt < nPts || lCnt < nPts); i++)
            {
               if(hCnt < nPts)
               {
                  bool isPH = true;
                  for(int k = 1; k <= per; k++)
                     if(i+k >= scanMax || high[i] <= high[i-k] || high[i] <= high[i+k]) { isPH=false; break; }
                  if(isPH) { hBars[hCnt] = i; hCnt++; }
               }
               if(lCnt < nPts)
               {
                  bool isPL = true;
                  for(int k = 1; k <= per; k++)
                     if(i+k >= scanMax || low[i] >= low[i-k] || low[i] >= low[i+k]) { isPL=false; break; }
                  if(isPL) { lBars[lCnt] = i; lCnt++; }
               }
            }
         }

         // Resistance envelope
         if(hCnt >= 2)
         {
            resFirstBar = hBars[hCnt-1]; resLastBar = hBars[0];
            resFirst = high[resFirstBar]; resLast = high[resLastBar];
            if(hCnt > 2)
            {
               double sl = (resLast - resFirst) / (double)(resFirstBar - resLastBar);
               for(int k = 1; k < hCnt-1; k++)
               { double d = high[hBars[k]] - (resLast + sl*(resLastBar-hBars[k])); if(d>0){resLast+=d;resFirst+=d;} }
            }
            if(AdaptiveTLDeviation > 1.0)
            {
               double sl2 = (resLast-resFirst)/(double)(resFirstBar-resLastBar); double se=0;
               for(int k=0;k<hCnt;k++){double e=high[hBars[k]]-(resLast+sl2*(resLastBar-hBars[k]));se+=e*e;}
               double sh=MathSqrt(se/hCnt)*(AdaptiveTLDeviation-1.0); resFirst+=sh; resLast+=sh;
            }
            resOk = true;
         }

         // Support envelope
         if(lCnt >= 2)
         {
            supFirstBar = lBars[lCnt-1]; supLastBar = lBars[0];
            supFirst = low[supFirstBar]; supLast = low[supLastBar];
            if(lCnt > 2)
            {
               double sl = (supLast-supFirst)/(double)(supFirstBar-supLastBar);
               for(int k=1;k<lCnt-1;k++)
               { double d=(supLast+sl*(supLastBar-lBars[k]))-low[lBars[k]]; if(d>0){supLast-=d;supFirst-=d;} }
            }
            if(AdaptiveTLDeviation > 1.0)
            {
               double sl2=(supLast-supFirst)/(double)(supFirstBar-supLastBar); double se=0;
               for(int k=0;k<lCnt;k++){double e=(supLast+sl2*(supLastBar-lBars[k]))-low[lBars[k]];se+=e*e;}
               double sh=MathSqrt(se/lCnt)*(AdaptiveTLDeviation-1.0); supFirst-=sh; supLast-=sh;
            }
            supOk = true;
         }
      }

      // ── Draw Resistance ──
      if(resOk)
      {
         string name = "GMZZ_ATL_RES";
         if(ObjectFind(0, name) < 0)
            ObjectCreate(0, name, OBJ_TREND, 0, time[resFirstBar], resFirst, time[resLastBar], resLast);
         else
         {
            ObjectSetInteger(0, name, OBJPROP_TIME, 0, time[resFirstBar]);
            ObjectSetDouble(0, name, OBJPROP_PRICE, 0, resFirst);
            ObjectSetInteger(0, name, OBJPROP_TIME, 1, time[resLastBar]);
            ObjectSetDouble(0, name, OBJPROP_PRICE, 1, resLast);
         }
         color c = (resLast > resFirst) ? AdaptiveUpColor : AdaptiveDownColor;
         ObjectSetInteger(0, name, OBJPROP_COLOR, c);
         ObjectSetInteger(0, name, OBJPROP_WIDTH, AdaptiveTLWidth);
         ObjectSetInteger(0, name, OBJPROP_STYLE, AdaptiveTLStyle);
         ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, AdaptiveTLRayRight);
         ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, name, OBJPROP_BACK, false);
      }

      // ── Draw Support ──
      if(supOk)
      {
         string name = "GMZZ_ATL_SUP";
         if(ObjectFind(0, name) < 0)
            ObjectCreate(0, name, OBJ_TREND, 0, time[supFirstBar], supFirst, time[supLastBar], supLast);
         else
         {
            ObjectSetInteger(0, name, OBJPROP_TIME, 0, time[supFirstBar]);
            ObjectSetDouble(0, name, OBJPROP_PRICE, 0, supFirst);
            ObjectSetInteger(0, name, OBJPROP_TIME, 1, time[supLastBar]);
            ObjectSetDouble(0, name, OBJPROP_PRICE, 1, supLast);
         }
         color c = (supLast > supFirst) ? AdaptiveUpColor : AdaptiveDownColor;
         ObjectSetInteger(0, name, OBJPROP_COLOR, c);
         ObjectSetInteger(0, name, OBJPROP_WIDTH, AdaptiveTLWidth);
         ObjectSetInteger(0, name, OBJPROP_STYLE, AdaptiveTLStyle);
         ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, AdaptiveTLRayRight);
         ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, name, OBJPROP_BACK, false);
      }

      // ── Fill background antara garis ATL (quadrilateral via 2 triangle) ──
      // Hanya fill jika kedua garis searah:
      //   keduanya UP (dongker)  → fill hijau muda
      //   keduanya DOWN (kuning) → fill merah muda
      //   mixed                  → tidak ada fill
      bool resUp = (resLast > resFirst);
      bool supUp = (supLast > supFirst);
      g_ATL_ResUp = resUp;
      g_ATL_SupUp = supUp;
      g_ATL_Valid = (resOk && supOk);
      color fillClr = clrNONE;
      bool doFill = false;
      if(resUp && supUp)          { fillClr = AdaptiveTLFillUp;   doFill = true; }
      else if(!resUp && !supUp)   { fillClr = AdaptiveTLFillDown; doFill = true; }

      if(AdaptiveTLFill && doFill && resOk && supOk)
      {
         // Gunakan rentang bar yang overlap antara res & sup
         // (bar lebih besar = lebih lama di AsSeries)
         int firstBar = MathMax(resFirstBar, supFirstBar);
         int lastBar  = MathMin(resLastBar,  supLastBar);
         if(firstBar > lastBar && firstBar < rates_total && lastBar >= 0)
         {
            // Interpolasi harga res & sup pada firstBar dan lastBar
            double resSlope = (resLast - resFirst) / (double)(resFirstBar - resLastBar);
            double supSlope = (supLast - supFirst) / (double)(supFirstBar - supLastBar);
            double resF = resLast + resSlope * (resLastBar - firstBar);
            double resL = resLast + resSlope * (resLastBar - lastBar);
            double supF = supLast + supSlope * (supLastBar - firstBar);
            double supL = supLast + supSlope * (supLastBar - lastBar);
            datetime tF = time[firstBar];
            datetime tL = time[lastBar];

            // Triangle 1: resF, resL, supL
            string t1 = "GMZZ_ATL_FILL1";
            if(ObjectFind(0, t1) < 0)
               ObjectCreate(0, t1, OBJ_TRIANGLE, 0, tF, resF, tL, resL);
            ObjectSetInteger(0, t1, OBJPROP_TIME,  0, tF);
            ObjectSetDouble (0, t1, OBJPROP_PRICE, 0, resF);
            ObjectSetInteger(0, t1, OBJPROP_TIME,  1, tL);
            ObjectSetDouble (0, t1, OBJPROP_PRICE, 1, resL);
            ObjectSetInteger(0, t1, OBJPROP_TIME,  2, tL);
            ObjectSetDouble (0, t1, OBJPROP_PRICE, 2, supL);
            ObjectSetInteger(0, t1, OBJPROP_COLOR, fillClr);
            ObjectSetInteger(0, t1, OBJPROP_FILL,  true);
            ObjectSetInteger(0, t1, OBJPROP_BACK,  true);
            ObjectSetInteger(0, t1, OBJPROP_SELECTABLE, false);
            ObjectSetInteger(0, t1, OBJPROP_HIDDEN, true);
            ObjectSetInteger(0, t1, OBJPROP_WIDTH, 1);

            // Triangle 2: resF, supL, supF
            string t2 = "GMZZ_ATL_FILL2";
            if(ObjectFind(0, t2) < 0)
               ObjectCreate(0, t2, OBJ_TRIANGLE, 0, tF, resF, tL, supL);
            ObjectSetInteger(0, t2, OBJPROP_TIME,  0, tF);
            ObjectSetDouble (0, t2, OBJPROP_PRICE, 0, resF);
            ObjectSetInteger(0, t2, OBJPROP_TIME,  1, tL);
            ObjectSetDouble (0, t2, OBJPROP_PRICE, 1, supL);
            ObjectSetInteger(0, t2, OBJPROP_TIME,  2, tF);
            ObjectSetDouble (0, t2, OBJPROP_PRICE, 2, supF);
            ObjectSetInteger(0, t2, OBJPROP_COLOR, fillClr);
            ObjectSetInteger(0, t2, OBJPROP_FILL,  true);
            ObjectSetInteger(0, t2, OBJPROP_BACK,  true);
            ObjectSetInteger(0, t2, OBJPROP_SELECTABLE, false);
            ObjectSetInteger(0, t2, OBJPROP_HIDDEN, true);
            ObjectSetInteger(0, t2, OBJPROP_WIDTH, 1);
         }
      }
   }

   // ── Pivot Trend Lines ────────────────────────────────────
   ObjectsDeleteAll(0, "GMTL_");
   if(ShowPivotTL)
   {
      g_PvtHighCnt = 0; g_PvtLowCnt = 0;
      int pvtLimit = MathMin(rates_total - PivotPeriod - 1, PivotScanCandles);

      // Cari pivot points
      for(int i = PivotPeriod; i < pvtLimit; i++)
      {
         // Pivot High
         if(g_PvtHighCnt < PivotScanCandles)
         {
            bool isPH = true;
            for(int k = 1; k <= PivotPeriod; k++)
            {
               if(i-k < 0 || i+k >= rates_total || high[i] <= high[i-k] || high[i] <= high[i+k])
                  { isPH = false; break; }
            }
            if(isPH) { g_PvtHighs[g_PvtHighCnt].price=high[i]; g_PvtHighs[g_PvtHighCnt].bar=i; g_PvtHighs[g_PvtHighCnt].time=time[i]; g_PvtHighCnt++; }
         }
         // Pivot Low
         if(g_PvtLowCnt < PivotScanCandles)
         {
            bool isPL = true;
            for(int k = 1; k <= PivotPeriod; k++)
            {
               if(i-k < 0 || i+k >= rates_total || low[i] >= low[i-k] || low[i] >= low[i+k])
                  { isPL = false; break; }
            }
            if(isPL) { g_PvtLows[g_PvtLowCnt].price=low[i]; g_PvtLows[g_PvtLowCnt].bar=i; g_PvtLows[g_PvtLowCnt].time=time[i]; g_PvtLowCnt++; }
         }
      }

      // Build resistance lines
      g_PvtResLineCnt = 0;
      for(int i = 0; i < g_PvtHighCnt-1 && g_PvtResLineCnt < PivotMaxLines; i++)
      {
         for(int j = i+1; j < g_PvtHighCnt && g_PvtResLineCnt < PivotMaxLines; j++)
         {
            if(j-i < PivotPoints-1) continue;
            PivotPt p1 = g_PvtHighs[j]; PivotPt p2 = g_PvtHighs[i];
            if(p1.bar == p2.bar) continue;
            double slope = (p2.price-p1.price)/(p1.bar-p2.bar);
            bool valid = true;
            for(int k = 0; k < g_PvtHighCnt; k++)
            {
               if(k==i||k==j) continue;
               if(g_PvtHighs[k].price > p2.price+slope*(p2.bar-g_PvtHighs[k].bar)+_Point*5) { valid=false; break; }
            }
            if(!valid) continue;
            g_PvtResLines[g_PvtResLineCnt].startPrice=p1.price; g_PvtResLines[g_PvtResLineCnt].endPrice=p2.price;
            g_PvtResLines[g_PvtResLineCnt].startBar=p1.bar; g_PvtResLines[g_PvtResLineCnt].endBar=p2.bar;
            g_PvtResLines[g_PvtResLineCnt].slope=slope; g_PvtResLines[g_PvtResLineCnt].broken=false;
            g_PvtResLineCnt++; break;
         }
      }

      // Build support lines
      g_PvtSupLineCnt = 0;
      for(int i = 0; i < g_PvtLowCnt-1 && g_PvtSupLineCnt < PivotMaxLines; i++)
      {
         for(int j = i+1; j < g_PvtLowCnt && g_PvtSupLineCnt < PivotMaxLines; j++)
         {
            if(j-i < PivotPoints-1) continue;
            PivotPt p1 = g_PvtLows[j]; PivotPt p2 = g_PvtLows[i];
            if(p1.bar == p2.bar) continue;
            double slope = (p2.price-p1.price)/(p1.bar-p2.bar);
            bool valid = true;
            for(int k = 0; k < g_PvtLowCnt; k++)
            {
               if(k==i||k==j) continue;
               if(g_PvtLows[k].price < p2.price+slope*(p2.bar-g_PvtLows[k].bar)-_Point*5) { valid=false; break; }
            }
            if(!valid) continue;
            g_PvtSupLines[g_PvtSupLineCnt].startPrice=p1.price; g_PvtSupLines[g_PvtSupLineCnt].endPrice=p2.price;
            g_PvtSupLines[g_PvtSupLineCnt].startBar=p1.bar; g_PvtSupLines[g_PvtSupLineCnt].endBar=p2.bar;
            g_PvtSupLines[g_PvtSupLineCnt].slope=slope; g_PvtSupLines[g_PvtSupLineCnt].broken=false;
            g_PvtSupLineCnt++; break;
         }
      }

      // Breakout check + draw
      double pvtCl = close[0];
      for(int i = 0; i < g_PvtResLineCnt; i++)
      {
         double val = g_PvtResLines[i].endPrice + g_PvtResLines[i].slope * (g_PvtResLines[i].endBar);
         if(pvtCl > val) g_PvtResLines[i].broken = true;

         string nm = "GMTL_LR_" + IntegerToString(i);
         color clr = g_PvtResLines[i].broken ? PivotBrokenColor : PivotResColor;
         int w = g_PvtResLines[i].broken ? 1 : PivotTLWidth;
         ENUM_LINE_STYLE st = g_PvtResLines[i].broken ? PivotBrokenStyle : PivotActiveStyle;
         datetime t1 = time[MathMin(g_PvtResLines[i].startBar, rates_total-1)];
         datetime t2 = time[MathMin(g_PvtResLines[i].endBar, rates_total-1)];

         if(ObjectFind(0, nm) < 0)
            ObjectCreate(0, nm, OBJ_TREND, 0, t1, g_PvtResLines[i].startPrice, t2, g_PvtResLines[i].endPrice);
         else
         {
            ObjectSetInteger(0, nm, OBJPROP_TIME,  0, t1);
            ObjectSetDouble(0, nm, OBJPROP_PRICE, 0, g_PvtResLines[i].startPrice);
            ObjectSetInteger(0, nm, OBJPROP_TIME,  1, t2);
            ObjectSetDouble(0, nm, OBJPROP_PRICE, 1, g_PvtResLines[i].endPrice);
         }
         ObjectSetInteger(0, nm, OBJPROP_COLOR, clr);
         ObjectSetInteger(0, nm, OBJPROP_WIDTH, w);
         ObjectSetInteger(0, nm, OBJPROP_STYLE, st);
         ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, PivotRayRight);
         ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, nm, OBJPROP_BACK, false);

         if(PivotShowLabels && !g_PvtResLines[i].broken)
         {
            double curVal = g_PvtResLines[i].endPrice + g_PvtResLines[i].slope * g_PvtResLines[i].endBar;
            string lbl = "GMTL_PR_" + IntegerToString(i);
            if(ObjectFind(0, lbl) < 0) ObjectCreate(0, lbl, OBJ_TEXT, 0, time[0], curVal);
            else ObjectMove(0, lbl, 0, time[0], curVal);
            ObjectSetString(0, lbl, OBJPROP_TEXT, DoubleToString(curVal, _Digits));
            ObjectSetInteger(0, lbl, OBJPROP_COLOR, clr);
            ObjectSetInteger(0, lbl, OBJPROP_FONTSIZE, 7);
            ObjectSetString(0, lbl, OBJPROP_FONT, "Arial");
            ObjectSetInteger(0, lbl, OBJPROP_SELECTABLE, false);
         }
      }

      for(int i = 0; i < g_PvtSupLineCnt; i++)
      {
         double val = g_PvtSupLines[i].endPrice + g_PvtSupLines[i].slope * (g_PvtSupLines[i].endBar);
         if(pvtCl < val) g_PvtSupLines[i].broken = true;

         string nm = "GMTL_LS_" + IntegerToString(i);
         color clr = g_PvtSupLines[i].broken ? PivotBrokenColor : PivotSupColor;
         int w = g_PvtSupLines[i].broken ? 1 : PivotTLWidth;
         ENUM_LINE_STYLE st = g_PvtSupLines[i].broken ? PivotBrokenStyle : PivotActiveStyle;
         datetime t1 = time[MathMin(g_PvtSupLines[i].startBar, rates_total-1)];
         datetime t2 = time[MathMin(g_PvtSupLines[i].endBar, rates_total-1)];

         if(ObjectFind(0, nm) < 0)
            ObjectCreate(0, nm, OBJ_TREND, 0, t1, g_PvtSupLines[i].startPrice, t2, g_PvtSupLines[i].endPrice);
         else
         {
            ObjectSetInteger(0, nm, OBJPROP_TIME,  0, t1);
            ObjectSetDouble(0, nm, OBJPROP_PRICE, 0, g_PvtSupLines[i].startPrice);
            ObjectSetInteger(0, nm, OBJPROP_TIME,  1, t2);
            ObjectSetDouble(0, nm, OBJPROP_PRICE, 1, g_PvtSupLines[i].endPrice);
         }
         ObjectSetInteger(0, nm, OBJPROP_COLOR, clr);
         ObjectSetInteger(0, nm, OBJPROP_WIDTH, w);
         ObjectSetInteger(0, nm, OBJPROP_STYLE, st);
         ObjectSetInteger(0, nm, OBJPROP_RAY_RIGHT, PivotRayRight);
         ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, nm, OBJPROP_BACK, false);

         if(PivotShowLabels && !g_PvtSupLines[i].broken)
         {
            double curVal = g_PvtSupLines[i].endPrice + g_PvtSupLines[i].slope * g_PvtSupLines[i].endBar;
            string lbl = "GMTL_PS_" + IntegerToString(i);
            if(ObjectFind(0, lbl) < 0) ObjectCreate(0, lbl, OBJ_TEXT, 0, time[0], curVal);
            else ObjectMove(0, lbl, 0, time[0], curVal);
            ObjectSetString(0, lbl, OBJPROP_TEXT, DoubleToString(curVal, _Digits));
            ObjectSetInteger(0, lbl, OBJPROP_COLOR, clr);
            ObjectSetInteger(0, lbl, OBJPROP_FONTSIZE, 7);
            ObjectSetString(0, lbl, OBJPROP_FONT, "Arial");
            ObjectSetInteger(0, lbl, OBJPROP_SELECTABLE, false);
         }
      }

      // Channel fill
      if(PivotFillChannel && g_PvtResLineCnt > 0 && g_PvtSupLineCnt > 0)
      {
         PivotTL res = g_PvtResLines[0]; PivotTL sup = g_PvtSupLines[0];
         double p2r = res.endPrice + res.slope * res.endBar;
         double p2s = sup.endPrice + sup.slope * sup.endBar;
         string fn = "GMTL_FILL";
         datetime ft1 = time[MathMin(MathMax(res.startBar, sup.startBar), rates_total-1)];
         if(ObjectFind(0, fn) < 0)
            ObjectCreate(0, fn, OBJ_RECTANGLE, 0, ft1, p2r, time[0], p2s);
         else
         {
            ObjectSetInteger(0, fn, OBJPROP_TIME, 0, ft1);
            ObjectSetDouble(0, fn, OBJPROP_PRICE, 0, p2r);
            ObjectSetInteger(0, fn, OBJPROP_TIME, 1, time[0]);
            ObjectSetDouble(0, fn, OBJPROP_PRICE, 1, p2s);
         }
         ObjectSetInteger(0, fn, OBJPROP_COLOR, PivotFillColor);
         ObjectSetInteger(0, fn, OBJPROP_FILL, true);
         ObjectSetInteger(0, fn, OBJPROP_BACK, true);
         ObjectSetInteger(0, fn, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, fn, OBJPROP_HIDDEN, true);
      }
   }

   // Multi-TF S/R (dari H4/D1 dll)
   DrawMTFSR();

   // Divergence detector (ZZ + RSI/MACD)
   DetectDivergence(time, high, low, limit);

   // Update cache dashboard setelah semua analisa siap
   UpdateDashboardCache(SymbolInfoDouble(_Symbol, SYMBOL_BID));

   return rates_total;
}
