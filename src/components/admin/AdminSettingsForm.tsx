"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSettingsForm({
  initialFee,
  initialArticleCommentsPerPage,
  initialMemberTimelinePerPage,
  initialMemberStatusCommentsPerPage,
  initialHomeMemberTickerVisible,
  initialHomeIndicatorsVisible,
  initialHomeNewsDomesticVisible,
  initialHomeNewsInternationalVisible,
  initialHomeNewsPerBlockHomepage,
  initialHomeNewsRssDomesticUrl,
  initialHomeNewsRssInternationalUrl,
  initialMarketplaceEscrowDays,
  initialHomeHeroEyebrow,
  initialHomeHeroTitle,
  initialHomeHeroSubtext,
  initialDepositUsdtBscAddress,
  initialDepositUsdtBscEnabled,
}: {
  initialFee: string;
  initialArticleCommentsPerPage: string;
  initialMemberTimelinePerPage: string;
  initialMemberStatusCommentsPerPage: string;
  initialHomeMemberTickerVisible: boolean;
  initialHomeIndicatorsVisible: boolean;
  initialHomeNewsDomesticVisible: boolean;
  initialHomeNewsInternationalVisible: boolean;
  initialHomeNewsPerBlockHomepage: string;
  initialHomeNewsRssDomesticUrl: string;
  initialHomeNewsRssInternationalUrl: string;
  initialMarketplaceEscrowDays: string;
  initialHomeHeroEyebrow: string;
  initialHomeHeroTitle: string;
  initialHomeHeroSubtext: string;
  initialDepositUsdtBscAddress: string;
  initialDepositUsdtBscEnabled: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState(initialFee);
  const [commentsPer, setCommentsPer] = useState(initialArticleCommentsPerPage);
  const [timelinePer, setTimelinePer] = useState(initialMemberTimelinePerPage);
  const [statusCommentsPer, setStatusCommentsPer] = useState(initialMemberStatusCommentsPerPage);
  const [memberTickerVisible, setMemberTickerVisible] = useState(initialHomeMemberTickerVisible);
  const [homeIndicatorsVisible, setHomeIndicatorsVisible] = useState(initialHomeIndicatorsVisible);
  const [homeNewsDomesticVisible, setHomeNewsDomesticVisible] = useState(initialHomeNewsDomesticVisible);
  const [homeNewsInternationalVisible, setHomeNewsInternationalVisible] = useState(
    initialHomeNewsInternationalVisible
  );
  const [homeNewsPerBlockHomepage, setHomeNewsPerBlockHomepage] = useState(
    initialHomeNewsPerBlockHomepage
  );
  const [rssDn, setRssDn] = useState(initialHomeNewsRssDomesticUrl);
  const [rssInt, setRssInt] = useState(initialHomeNewsRssInternationalUrl);
  const [escrowDays, setEscrowDays] = useState(initialMarketplaceEscrowDays);
  const [homeHeroEyebrow, setHomeHeroEyebrow] = useState(initialHomeHeroEyebrow);
  const [homeHeroTitle, setHomeHeroTitle] = useState(initialHomeHeroTitle);
  const [homeHeroSubtext, setHomeHeroSubtext] = useState(initialHomeHeroSubtext);
  const [depositUsdtAddr, setDepositUsdtAddr] = useState(initialDepositUsdtBscAddress);
  const [depositUsdtEnabled, setDepositUsdtEnabled] = useState(initialDepositUsdtBscEnabled);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformFeePercent: v,
        articleCommentsPerPage: commentsPer,
        memberTimelinePerPage: timelinePer,
        memberStatusCommentsPerPage: statusCommentsPer,
        homeMemberTickerVisible: memberTickerVisible,
        homeIndicatorsVisible,
        homeNewsDomesticVisible: homeNewsDomesticVisible,
        homeNewsInternationalVisible: homeNewsInternationalVisible,
        homeNewsPerBlockHomepage: homeNewsPerBlockHomepage,
        homeNewsRssDomesticUrl: rssDn,
        homeNewsRssInternationalUrl: rssInt,
        marketplaceEscrowDays: escrowDays,
        homeHeroEyebrow,
        homeHeroTitle,
        homeHeroSubtext,
        depositUsdtBscAddress: depositUsdtAddr,
        depositUsdtBscEnabled: depositUsdtEnabled,
      }),
    });
    setMsg(res.ok ? "Disimpan." : "Gagal");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
        <p className="text-sm font-medium text-gray-800">Hero beranda (/)</p>
        <p className="mt-1 text-xs text-gray-500">
          Teks di bagian atas halaman utama. Kosongkan salah satu field lalu simpan untuk mengembalikan teks
          bawaan pada field tersebut.
        </p>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Label kecil (uppercase di situs)</span>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={homeHeroEyebrow}
            onChange={(e) => setHomeHeroEyebrow(e.target.value)}
            maxLength={120}
          />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">Judul utama</span>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={homeHeroTitle}
            onChange={(e) => setHomeHeroTitle(e.target.value)}
            maxLength={400}
          />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">Paragraf penjelasan</span>
          <textarea
            className="mt-1 min-h-[120px] w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={homeHeroSubtext}
            onChange={(e) => setHomeHeroSubtext(e.target.value)}
            maxLength={4000}
            rows={5}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-gray-600">Hari escrow marketplace (1–30)</span>
        <input
          type="number"
          min={1}
          max={30}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={escrowDays}
          onChange={(e) => setEscrowDays(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Setelah pembelian berbayar, dana penjual ditahan selama N hari kecuali pembeli mengonfirmasi lebih awal atau ada
          komplain. Cron harus memanggil endpoint pencairan otomatis.
        </span>
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Platform fee (%)</span>
        <input
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Komentar artikel per halaman (5–50)</span>
        <input
          type="number"
          min={5}
          max={50}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={commentsPer}
          onChange={(e) => setCommentsPer(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Dipakai di halaman publik artikel; pagination muncul jika komentar lebih dari nilai ini.
        </span>
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Linimasa member — status per halaman (5–50)</span>
        <input
          type="number"
          min={5}
          max={50}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={timelinePer}
          onChange={(e) => setTimelinePer(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Halaman publik profil member (`/nama-member`): jumlah status yang ditampilkan per halaman.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={memberTickerVisible}
          onChange={(e) => setMemberTickerVisible(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>
          <span className="font-medium text-gray-800">Tampilkan strip &quot;Member baru&quot; di beranda</span>
          <span className="mt-1 block text-xs text-gray-500">
            Bilah horizontal di bawah hero yang menampilkan nama member terbaru. Nonaktifkan jika ingin
            menyembunyikannya.
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={homeIndicatorsVisible}
          onChange={(e) => setHomeIndicatorsVisible(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>
          <span className="font-medium text-gray-800">Tampilkan blok &quot;Indikator&quot; di beranda</span>
          <span className="mt-1 block text-xs text-gray-500">
            Kartu indikator dipublikasikan (maks. 6 terbaru) di atas &quot;Artikel terbaru&quot;. Nonaktifkan untuk
            menyembunyikan blok ini.
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={homeNewsDomesticVisible}
          onChange={(e) => setHomeNewsDomesticVisible(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>
          <span className="font-medium text-gray-800">Tampilkan blok &quot;Berita dalam negeri&quot; di beranda</span>
          <span className="mt-1 block text-xs text-gray-500">
            Menyembunyikan hanya di halaman utama; halaman /berita dan artikel tetap bisa diakses.
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={homeNewsInternationalVisible}
          onChange={(e) => setHomeNewsInternationalVisible(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>
          <span className="font-medium text-gray-800">Tampilkan blok &quot;Berita internasional&quot; di beranda</span>
          <span className="mt-1 block text-xs text-gray-500">
            Sama seperti di atas — hanya mengatur tampilan di beranda.
          </span>
        </span>
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Jumlah berita per blok di beranda (1–24)</span>
        <input
          type="number"
          min={1}
          max={24}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={homeNewsPerBlockHomepage}
          onChange={(e) => setHomeNewsPerBlockHomepage(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Berlaku terpisah untuk &quot;Berita dalam negeri&quot; dan &quot;Berita internasional&quot; (masing-masing
          menampilkan hingga nilai ini). Default 6.
        </span>
      </label>
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-800">RSS berita beranda</p>
        <p className="mt-1 text-xs text-gray-500">
          URL tersimpan untuk impor cepat di Admin → Berita beranda. Kosongkan untuk menghapus.
        </p>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Feed RSS — dalam negeri</span>
          <input
            type="url"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={rssDn}
            onChange={(e) => setRssDn(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">Feed RSS — internasional</span>
          <input
            type="url"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={rssInt}
            onChange={(e) => setRssInt(e.target.value)}
            placeholder="https://…"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-gray-600">Linimasa member — komentar per status per halaman (5–50)</span>
        <input
          type="number"
          min={5}
          max={50}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={statusCommentsPer}
          onChange={(e) => setStatusCommentsPer(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Di bawah setiap status: komentar dipecah per halaman (parameter query per status).
        </span>
      </label>
      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
        <p className="text-sm font-medium text-gray-800">Deposit USDT (BSC / BEP-20)</p>
        <p className="mt-1 text-xs text-gray-500">
          Alamat wallet admin tempat member mengirim USDT. Kosongkan untuk menghapus. BSCScan API key dikonfigurasi
          lewat env var <code className="rounded bg-gray-100 px-1">BSCSCAN_API_KEY</code>.
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={depositUsdtEnabled}
            onChange={(e) => setDepositUsdtEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>
            <span className="font-medium text-gray-800">Aktifkan deposit USDT</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Nonaktifkan untuk menyembunyikan form deposit dari member (misal saat maintenance).
            </span>
          </span>
        </label>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Alamat BSC admin (0x…)</span>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
            value={depositUsdtAddr}
            onChange={(e) => setDepositUsdtAddr(e.target.value)}
            placeholder="0x…"
            maxLength={42}
          />
          <span className="mt-1 block text-xs text-gray-500">
            Harus berupa alamat BSC valid (0x + 40 karakter hex). Member mengirim USDT ke alamat ini.
          </span>
        </label>
      </div>

      <button type="submit" className="rounded bg-green-600 px-4 py-2 text-sm text-white">
        Simpan
      </button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  );
}
