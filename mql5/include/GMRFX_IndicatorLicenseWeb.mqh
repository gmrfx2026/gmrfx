//+------------------------------------------------------------------+
//| GMRFX_IndicatorLicenseWeb.mqh                                    |
//| Verifikasi lisensi indikator ke https://gmrfx.app/api/mt/license/verify |
//|                                                                  |
//| INTEGRASI GMRFX_ZZ_V3.2.1.mq5 (paling sedikit edit):             |
//| 1) Salin GMRFX_IndicatorLicenseWeb.mqh + GMRFX_ZZ_WebLicense.mqh |
//|    ke folder MQL5/Include.                                       |
//| 2) Hapus input license lama + #define GMRFX_LICENSE_KEY + blok   |
//|    if(LicenseKey!=GMRFX_LICENSE_KEY) di OnInit.                  |
//| 3) Di tempat input license: #include <GMRFX_ZZ_WebLicense.mqh>  |
//| 4) OnInit sebelum SetIndexBuffer:                                |
//|    if(!GmrfxZZ_OnInitLicense()) return INIT_FAILED;              |
//| 5) Baris pertama OnCalculate:                                    |
//|    int _g=GmrfxZZ_OnCalculateLicenseGate(prev_calculated);      |
//|    if(_g>=0) return _g;                                          |
//| 6) MT5: Allow WebRequest untuk https://gmrfx.app                 |
//|                                                                  |
//| (Alternatif: include hanya file ini + input/fungsi sendiri.)     |
//+------------------------------------------------------------------+

#ifndef GMRFX_INDICATOR_LICENSE_WEB_MQH
#define GMRFX_INDICATOR_LICENSE_WEB_MQH

#define GMRFX_LICENSE_VERIFY_PATH "/api/mt/license/verify"

// --- internal cache (per chart / per indikator yang include file ini) ---
static datetime s_gmrfx_lic_last_check = 0;
static bool     s_gmrfx_lic_ok = false;
static string   s_gmrfx_lic_last_err = "";
static datetime s_gmrfx_lic_valid_until = 0;

string GmrfxLicJsonEscape(const string s)
{
   string o = s;
   StringReplace(o, "\\", "\\\\");
   StringReplace(o, "\"", "\\\"");
   StringReplace(o, "\r", " ");
   StringReplace(o, "\n", " ");
   return o;
}

string GmrfxLicNormalizeBase(const string base)
{
   string b = base;
   StringTrimLeft(b);
   StringTrimRight(b);
   while(StringLen(b) > 0 && StringSubstr(b, StringLen(b) - 1, 1) == "/")
      b = StringSubstr(b, 0, StringLen(b) - 1);
   return b;
}

bool GmrfxLicParseIso8601Utc(const string iso_raw, datetime &out_dt)
{
   string iso = iso_raw;
   StringTrimLeft(iso);
   StringTrimRight(iso);
   if(StringLen(iso) < 19)
      return false;
   // "2026-04-16T12:34:56.000Z" atau tanpa Z
   string d = StringSubstr(iso, 0, 10);
   StringReplace(d, "-", ".");
   string t = StringSubstr(iso, 11, 8);
   if(StringLen(t) < 8)
      return false;
   string full = d + " " + t;
   out_dt = StringToTime(full);
   return (out_dt > 0);
}

bool GmrfxLicResponseJsonHasOkTrue(const string body)
{
   if(StringFind(body, "\"ok\":true") >= 0)
      return true;
   if(StringFind(body, "\"ok\": true") >= 0)
      return true;
   return false;
}

bool GmrfxLicExtractJsonString(const string body, const string key, string &out_val)
{
   string needle = "\"" + key + "\":\"";
   int p = StringFind(body, needle);
   if(p < 0)
      return false;
   p += StringLen(needle);
   int q = StringFind(body, "\"", p);
   if(q < 0)
      return false;
   out_val = StringSubstr(body, p, q - p);
   return true;
}

/**
 * POST verifikasi ke API GMRFX. Mem-parse JSON respons (tanpa library eksternal).
 * @param api_base  Mis. https://gmrfx.app (tanpa slash akhir)
 * @return true jika HTTP 200 dan ok:true
 */
bool GmrfxVerifyIndicatorLicenseWeb(
   const string api_base,
   const string product_code,
   const string email,
   const string license_key,
   const int timeout_ms,
   string &out_error,
   datetime &out_valid_until
)
{
   out_error = "";
   out_valid_until = 0;

   string base = GmrfxLicNormalizeBase(api_base);
   if(StringLen(base) < 12)
   {
      out_error = "API base URL kosong/tidak valid";
      return false;
   }

   string pc = product_code;
   StringTrimLeft(pc);
   StringTrimRight(pc);
   string em = email;
   StringTrimLeft(em);
   StringTrimRight(em);
   string lk = license_key;
   StringTrimLeft(lk);
   StringTrimRight(lk);

   if(StringLen(pc) < 1 || StringLen(em) < 3 || StringLen(lk) < 16)
   {
      out_error = "Isi Product Code, Email (akun GMRFX), dan License Key";
      return false;
   }

   string url = base + GMRFX_LICENSE_VERIFY_PATH;
   string json = "{";
   json += "\"productCode\":\"" + GmrfxLicJsonEscape(pc) + "\",";
   json += "\"email\":\"" + GmrfxLicJsonEscape(em) + "\",";
   json += "\"licenseKey\":\"" + GmrfxLicJsonEscape(lk) + "\"";
   json += "}";

   string headers = "Content-Type: application/json; charset=utf-8\r\n";

   uchar post[];
   uchar result[];
   string result_headers;

   int conv = StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   if(conv < 2)
   {
      out_error = "Gagal bentuk body JSON";
      return false;
   }
   ArrayResize(post, conv - 1);

   ResetLastError();
   int code = WebRequest("POST", url, headers, timeout_ms, post, result, result_headers);
   if(code == -1)
   {
      int err = GetLastError();
      out_error = StringFormat("WebRequest gagal (err=%d). Izinkan URL di Tools→Options→Expert Advisors→Allow WebRequest: %s", err, base);
      return false;
   }

   string resp = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);

   if(!GmrfxLicResponseJsonHasOkTrue(resp))
   {
      string msg = "";
      if(!GmrfxLicExtractJsonString(resp, "error", msg))
         msg = StringFormat("HTTP %d — respons tidak valid", code);
      out_error = msg;
      string vu = "";
      if(GmrfxLicExtractJsonString(resp, "validUntil", vu))
         GmrfxLicParseIso8601Utc(vu, out_valid_until);
      return false;
   }

   string vu = "";
   if(GmrfxLicExtractJsonString(resp, "validUntil", vu))
      GmrfxLicParseIso8601Utc(vu, out_valid_until);

   if(code < 200 || code >= 300)
   {
      out_error = StringFormat("HTTP %d", code);
      return false;
   }

   return true;
}

void GmrfxLicenseCacheUpdate(const bool ok, const string err, const datetime valid_until)
{
   s_gmrfx_lic_ok = ok;
   s_gmrfx_lic_last_err = err;
   s_gmrfx_lic_valid_until = valid_until;
   s_gmrfx_lic_last_check = TimeCurrent();
}

/**
 * Panggil dari OnInit: verifikasi pertama.
 */
bool GmrfxLicenseInitWeb(
   const string api_base,
   const string product_code,
   const string email,
   const string license_key,
   const int timeout_ms
)
{
   string err = "";
   datetime vu = 0;
   bool ok = GmrfxVerifyIndicatorLicenseWeb(api_base, product_code, email, license_key, timeout_ms, err, vu);
   GmrfxLicenseCacheUpdate(ok, err, vu);
   return ok;
}

/**
 * Panggil di awal OnCalculate: refresh berkala. Jika gagal, s_gmrfx_lic_ok false.
 */
bool GmrfxLicenseRefreshIfDue(
   const string api_base,
   const string product_code,
   const string email,
   const string license_key,
   const int timeout_ms,
   const int interval_sec
)
{
   if(interval_sec <= 0)
      return s_gmrfx_lic_ok;

   datetime now = TimeCurrent();
   if(s_gmrfx_lic_last_check > 0 && (now - s_gmrfx_lic_last_check) < interval_sec)
      return s_gmrfx_lic_ok;

   string err = "";
   datetime vu = 0;
   bool ok = GmrfxVerifyIndicatorLicenseWeb(api_base, product_code, email, license_key, timeout_ms, err, vu);
   GmrfxLicenseCacheUpdate(ok, err, vu);
   return ok;
}

bool GmrfxLicenseIsOk()
{
   return s_gmrfx_lic_ok;
}

string GmrfxLicenseLastError()
{
   return s_gmrfx_lic_last_err;
}

datetime GmrfxLicenseValidUntil()
{
   return s_gmrfx_lic_valid_until;
}

#endif
