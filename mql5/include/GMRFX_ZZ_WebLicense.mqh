//+------------------------------------------------------------------+
//| GMRFX_ZZ_WebLicense.mqh                                        |
//| Sisipkan ke GMRFX_ZZ_V3.2.1.mq5 — lihat komentar INTEGRASI di bawah |
//+------------------------------------------------------------------+
#ifndef GMRFX_ZZ_WEB_LICENSE_MQH
#define GMRFX_ZZ_WEB_LICENSE_MQH

#include <GMRFX_IndicatorLicenseWeb.mqh>

// --- ganti blok input license lama + #define GMRFX_LICENSE_KEY dengan include ini ---
input string InpLicHdr = "";                    // ─── Lisensi GMRFX (gmrfx.app) ───
input string InpLicApiBase = "https://gmrfx.app"; // API (Allow WebRequest URL ini)
input string InpLicProductCode = "GMRFX_ZZ";    // Sama dengan kode produk di admin web
input string InpLicEmail = "";                  // Email akun gmrfx.app (pembeli)
input string InpLicKey = "";                   // License key dari profil / halaman indikator
input int    InpLicIntervalSec = 3600;         // Cek ulang ke server (detik)
input int    InpLicTimeoutMs = 12000;          // Timeout HTTP (ms)

/**
 * Panggil dari OnInit() menggantikan pengecekan LicenseKey vs define statis.
 */
bool GmrfxZZ_OnInitLicense()
{
   if(!GmrfxLicenseInitWeb(InpLicApiBase, InpLicProductCode, InpLicEmail, InpLicKey, InpLicTimeoutMs))
   {
      string msg = "GMRFX ZZ: verifikasi lisensi gagal.\n" + GmrfxLicenseLastError() +
                   "\n\nPastikan:\n- Email = akun GMRFX\n- Product code = di admin\n- Key dari pembelian\n- WebRequest untuk " +
                   InpLicApiBase;
      Alert(msg);
      Comment("\n\n   GMRFX ZZ — LISENSI\n   ", GmrfxLicenseLastError());
      Print("GMRFX ZZ: INIT_FAILED — ", GmrfxLicenseLastError());
      return false;
   }
   Comment("");
   return true;
}

/**
 * Panggil di baris pertama OnCalculate (sebelum logika ZigZag).
 * @return Jika >= 0, return nilai ini dari OnCalculate (lisensi belum OK / perlu skip).
 *         Jika -1, lanjutkan perhitungan biasa.
 */
int GmrfxZZ_OnCalculateLicenseGate(const int prev_calculated)
{
   if(GmrfxLicenseRefreshIfDue(InpLicApiBase, InpLicProductCode, InpLicEmail, InpLicKey,
                               InpLicTimeoutMs, InpLicIntervalSec))
      return -1;
   Comment("\n\n   GMRFX ZZ — LISENSI\n   ", GmrfxLicenseLastError());
   return (prev_calculated > 0 ? prev_calculated : 0);
}

// Langkah sisip ke GMRFX_ZZ_V3.2.1.mq5: lihat komentar INTEGRASI di GMRFX_IndicatorLicenseWeb.mqh
// (sama: #include ini, hapus cek key statis, panggil GmrfxZZ_OnInitLicense + OnCalculateLicenseGate).

#endif
