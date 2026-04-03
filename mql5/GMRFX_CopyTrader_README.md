# GMRFX CopyTrader EA (MT5 & MT4)

EA untuk meng-copy trading secara otomatis dari akun komunitas GMR FX.

## Cara Kerja

```
Website                           MT5/MT4 Copier EA
──────                            ─────────────────
[Klik tombol Copy di komunitas]   InpApiToken = token EA Anda
        ↓                                  ↓
MtCopyFollow disimpan di DB  →  GET /api/community/copy-feeds
        ↓                         (Bearer token EA copier)
Publisher kirim data via EA →     Posisi publisher dikembalikan
GMRFX_TradeLogger                 EA buka/tutup/sinkron otomatis
```

**Anda tidak perlu tahu OwnerId atau MtLogin publisher.**
Cukup klik tombol **Copy** di halaman komunitas, lalu EA berjalan otomatis.

**Masa berlaku**: 30 hari untuk semua langganan (gratis maupun berbayar).
Setelah 30 hari klik tombol Copy lagi untuk perpanjang.

## Langkah Setup

### 1. Klik Copy di website
- Buka halaman komunitas publisher di gmrfx.app
- Klik tombol **Copy** (gratis atau berbayar sesuai publisher)
- Selesai — website menyimpan langganan Anda

### 2. Ambil Token EA Anda
- Login ke gmrfx.app
- Profil → Portofolio → Dashboard → Token EA
- Salin token (bukan token publisher — token milik Anda sendiri)

### 3. Izinkan URL di MetaTrader
Tools → Options → Expert Advisors → Allow WebRequest for listed URL:
```
https://gmrfx.app
```

### 4. Pasang EA di chart
- Buka chart manapun (simbol chart tidak relevan)
- Drag `GMRFX_CopyTrader` ke chart
- Isi parameter:

| Parameter | Penjelasan |
|-----------|-----------|
| `InpApiBase` | `https://gmrfx.app` (default sudah benar) |
| `InpApiToken` | **Token EA ANDA sendiri** (bukan publisher) |
| `InpIntervalSec` | Interval polling detik (min 5, disarankan 10) |
| `InpMagic` | Magic number unik untuk order copy |
| `InpVolumeMode` | `VOL_FIXED` = lot tetap, `VOL_RATIO` = proporsional |
| `InpFixedLot` | Lot per posisi jika Fixed (mis. `0.01`) |
| `InpRatio` | Pengali volume jika Ratio (mis. `0.5` = setengah lot publisher) |
| `InpCopyClose` | `true` = tutup posisi lokal jika publisher tutup |
| `InpCopySL` | `true` = sinkron StopLoss |
| `InpCopyTP` | `true` = sinkron TakeProfit |
| `InpUseSuffix` | `true` jika broker pakai suffix simbol (mis. EURUSDm) |
| `InpSuffix` | Suffix simbol (mis. `m`, `.r`) |
| `InpSlippage` | Toleransi slippage |
| `InpSymbolFilter` | Hanya copy simbol ini, dipisah koma (kosong = semua) |

### 5. Aktifkan AutoTrading
Tekan Ctrl+E atau klik tombol **AutoTrading** di toolbar.

---

## Multi-Publisher

EA secara otomatis menangani **beberapa publisher sekaligus**.
Jika Anda klik Copy di 3 akun berbeda, EA akan copy posisi dari ketiganya
dalam satu polling, menggunakan satu token yang sama.

---

## Optimisasi Delay Rendah

| Teknik | Efek |
|--------|------|
| Timer 5 detik (MT5) / tick-based timer (MT4) | Polling secepat mungkin |
| **ETag + HTTP 304** | Jika snapshot belum berubah, server jawab kosong ~1ms |
| Magic number + komentar unik per publisher | Tidak bentrok dengan EA lain |

**Delay efektif sebenarnya** dibatasi oleh interval EA logger publisher.
Untuk delay minimal, publisher perlu set `InpIntervalSec=60` di `GMRFX_TradeLogger`.

---

## Catatan

- Copy trading tidak menjamin profit.
- Slippage, spread, dan kondisi pasar berbeda dapat menyebabkan hasil berbeda dari publisher.
- Satu token dapat digunakan untuk follow banyak publisher sekaligus.
- Token sama bisa juga digunakan di `GMRFX_TradeLogger` (untuk kirim data portofolio Anda sendiri).
