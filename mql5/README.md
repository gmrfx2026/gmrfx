# Expert Advisor GMR FX — log transaksi MT5

Untuk **MetaTrader 4**, gunakan folder **`mql4/`** (`GMRFX_TradeLogger.mq4` → endpoint **`/api/mt4/ingest`**).

File **`GMRFX_TradeLogger.mq5`** mengirim:

- snapshot **balance / equity / margin** akun dan kode **mata uang deposit** (`account.currency`, dari `ACCOUNT_CURRENCY` terminal);
- semua **deal** dalam rentang histori (default 14 hari) ke endpoint `POST /api/mt5/ingest`.

Per deal trading (buy/sell), EA juga mengirim **`positionId`** (MT5 `DEAL_POSITION_ID`) dan, untuk kaki **penutupan** (OUT / OUT_BY), **`positionOpenTime`** (Unix detik dari deal **masuk** pertama posisi itu) agar backend bisa menghitung **durasi posisi** tanpa UI tambahan di EA.

Setelah migrasi DB terbaru, jalankan `npx prisma migrate deploy` agar kolom `positionId` dan `positionOpenTime` ada di tabel `MtDeal`.

## Langkah singkat

1. Di website: login → **Profil → Portofolio → Ringkasan** → **Buat token baru** → salin token (hanya muncul sekali).
2. Di **MetaEditor**, buka `GMRFX_TradeLogger.mq5`, compile (F7), pasang EA pada chart di MT5.
3. Parameter EA:
   - **InpApiBase**: URL situs Anda, mis. `https://gmrfx.example.com` (tanpa `/` di akhir).
   - **InpApiToken**: token dari dashboard.
   - **InpIntervalSec**: minimal 60 detik antar kirim.
   - **InpHistoryDays**: berapa hari ke belakang deal diambil dari histori terminal.
4. **Wajib** di MT5: **Tools → Options → Expert Advisors** → centang **Allow WebRequest for listed URL** → tambahkan domain Anda (mis. `https://gmrfx.example.com`).

Tanpa izin URL, `WebRequest` gagal (kode error 4060).

## HTTPS

Gunakan URL **https** yang valid (sertifikat dipercaya browser). Localhost dengan self-signed biasanya ditolak oleh `WebRequest` kecuali Anda menambahkan pengecualian di OS/MT5.

## Migrasi database

Setelah pull kode backend:

```bash
npx prisma migrate deploy
```

Opsional: set **`MT5_TOKEN_PEPPER`** di `.env` produksi (string acak panjang) agar hash token tidak bergantung pada default dev.

## Keamanan

- Token = sandi: jangan commit ke repositori atau bagikan.
- Cabut token di dashboard jika bocor.
- Endpoint ingest tidak memakai cookie sesi; hanya **Bearer token** yang disimpan sebagai hash di database.

## Siapa pemilik data di website?

- Token dibuat di dashboard saat **sudah login** sebagai member tertentu → di database token **terikat ke `userId` member itu**.
- EA mengirim `Authorization: Bearer <token>` → server mencari token → semua **deal** dan **snapshot** disimpan untuk **member tersebut**.
- Field **`login`** di JSON adalah nomor akun MetaTrader; dipakai membedakan beberapa akun MT (mis. demo & live) **untuk member yang sama**.
- Satu member boleh punya **lebih dari satu token** (mis. komputer berbeda); semuanya tetap mengarah ke akun website yang sama. Jangan pakai token orang lain — datanya akan masuk ke akun mereka.
