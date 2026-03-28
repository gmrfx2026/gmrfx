# Expert Advisor GMR FX — MetaTrader 4

File **`GMRFX_TradeLogger.mq4`** mengirim:

- snapshot **balance / equity / margin** akun MT4;
- hingga **2500** order **market** yang sudah **ditutup** (`OP_BUY` / `OP_SELL`) dalam rentang `InpHistoryDays`, berdasarkan **waktu tutup** (`OrderCloseTime`).

Endpoint: **`POST /api/mt4/ingest`** — di server Next.js ini **alias** ke handler yang sama dengan `/api/mt5/ingest` (format JSON deal identik).

## Pemetaan MT4 → server

| MT4 (histori) | JSON / DB |
|---------------|-----------|
| `OrderTicket()` | `ticket`, `positionId` (satu ticket = satu posisi market) |
| `OrderCloseTime()` | `dealTime` (Unix detik) |
| `OrderOpenTime()` | `positionOpenTime` |
| `OrderType()` OP_BUY / OP_SELL | `dealType` 0 / 1 (sama konvensi MT5) |
| — | `entryType` selalu **1** (OUT / penutupan) agar masuk statistik “deal penutupan” |
| `OrderClosePrice()`, lots, profit, swap, commission, magic, comment | kolom setara MT5 |

**Bukan** dikirim: pending saja belum dieksekusi; order tipe lain di histori (jika ada) di-skip.

## Persyaratan terminal

- **MetaTrader 4** build yang mendukung **`WebRequest`** dengan parameter seperti MT5 (umum pada build terbaru).
- **Tools → Options → Expert Advisors** → centang **Allow WebRequest** → tambahkan URL penuh, mis. `https://domain-anda.com/api/mt4/ingest` (atau root domain sesuai kebijakan MT4 Anda).

## Langkah pasang

1. Di website: **Profil → Portofolio → Ringkasan** → buat token (sama untuk MT4/MT5).
2. Buka `GMRFX_TradeLogger.mq4` di **MetaEditor** MT4, compile, tempel EA pada chart.
3. Input:
   - **InpApiBase**: `https://domain-anda.com` (tanpa `/` di akhir).
   - **InpApiToken**: token Bearer dari dashboard.
   - **InpIntervalSec** ≥ 60.
   - **InpHistoryDays**: rentang hari ke belakang untuk order tutup.

## Perbedaan penting vs MT5

- MT4 memakai **order historis**, bukan **deal** bertingkat (IN/OUT) seperti MT5.
- Partial close / scaling di MT4 bisa tercatat sebagai **beberapa order** terpisah; server menyimpan per `ticket`.
- Untuk fitur lanjutan yang mengandalkan banyak deal per posisi MT5, perilaku agregasi bisa sedikit berbeda.

## Migrasi database

Sama seperti MT5: pastikan migrasi Prisma sudah di-deploy (`npx prisma migrate deploy`).

Lihat juga **`mql5/README.md`** untuk konteks token dan keamanan.
