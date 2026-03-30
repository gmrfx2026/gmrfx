import type { PrismaClient } from "@prisma/client";
import { ArticleStatus, Role } from "@prisma/client";

export type EducationalArticleRow = { slug: string; title: string; excerpt: string; contentHtml: string };

const DISCLAIMER =
  "<p><em>Artikel ini untuk edukasi umum saja, bukan saran investasi atau rekomendasi produk. Perdagangan forex dan CFD memiliki risiko tinggi; pertimbangkan tujuan dan pengalaman Anda sebelum memutuskan.</em></p>";

function educationalArticlesHtml(): EducationalArticleRow[] {
  const d = DISCLAIMER;
  return [
    {
      slug: "mengenal-margin-dan-leverage-forex",
      title: "Mengenal margin dan leverage dalam forex",
      excerpt:
        "Margin adalah jaminan yang menahan posisi; leverage memperbesar eksposur. Pahami rumusnya agar tidak kaget saat equity bergerak cepat.",
      contentHtml: `<h2>Apa itu margin?</h2>
<p>Margin adalah dana yang &quot;dibekukan&quot; broker sebagai jaminan saat Anda membuka posisi. Besarnya bergantung pada ukuran kontrak (lot), leverage akun, dan harga instrumen.</p>
<h2>Leverage: pedang bermata dua</h2>
<p>Leverage memungkinkan Anda mengontrol nominal yang jauh lebih besar dari modal yang benar-benar Anda setor. Contoh: leverage 1:100 berarti dengan $100 margin teoretis Anda bisa membuka posisi hingga nilai notional yang setara dengan pengali tersebut—namun risiko kerugian juga meningkat proporsional terhadap pergerakan harga.</p>
<ul>
<li><strong>Manfaat:</strong> partisipasi pasar dengan modal relatif kecil.</li>
<li><strong>Risiko:</strong> fluktuasi kecil pada harga bisa berdampak besar pada persentase kerugian modal (dan potensi margin call/stop out).</li>
</ul>
<h2>Free margin dan margin level</h2>
<p><strong>Free margin</strong> adalah sisa margin yang masih bisa dipakai untuk posisi baru. <strong>Margin level</strong> (biasanya equity dibagi margin terpakai) dipakai broker untuk menilai apakah posisi perlu ditutup paksa saat modal menipis.</p>
<h2>Praktik aman</h2>
<ul>
<li>Gunakan ukuran posisi konservatif relatif terhadap saldo.</li>
<li>Selalu hitung risiko per trade (misalnya maksimal kerugian 1–2% modal).</li>
<li>Jangan mengandalkan leverage maksimal &quot;default&quot; tanpa memahami dampaknya.</li>
</ul>
${d}`,
    },
    {
      slug: "manajemen-risiko-trader-pemula",
      title: "Manajemen risiko sederhana untuk trader pemula",
      excerpt:
        "Tanpa aturan risiko, strategi apapun bisa runtuh. Mulai dari batas kerugian per trade, rasio risk-reward, dan disiplin lot.",
      contentHtml: `<h2>Mengapa manajemen risiko nomor satu</h2>
<p>Win rate tinggi saja tidak cukup jika beberapa kerugian besar menghapus banyak kemenangan kecil. Tujuan jangka panjang adalah bertahan di pasar—bukan menang setiap hari.</p>
<h2>Aturan 1–2% per trade</h2>
<p>Banyak pedoman menganjurkan membatasi risiko maksimal sekitar 1–2% dari modal per transaksi. Angka ini fleksibel; yang penting Anda konsisten dan tidak menggandakan lot secara emosional setelah loss.</p>
<h2>Stop loss bukan opsional</h2>
<p>Tentukan level stop loss <em>sebelum</em> masuk pasar, sesuai struktur harga atau volatilitas (bukan dipindah-pindah karena panik). Jarak stop ke entry mempengaruhi ukuran lot yang masuk akal.</p>
<h2>Risk-reward</h2>
<p>Membandingkan jarak ke stop loss dengan jarak ke target profit membantu menilai apakah suatu setup layak diambil. Anda tidak harus selalu R:R 1:3, tetapi hindari setup di mana potensi rugi jauh lebih besar dari potensi untung tanpa alasan kuat.</p>
<h2>Jurnal singkat</h2>
<p>Catat alasan masuk, screenshot level, dan hasil. Pola kesalahan berulang (revenge trading, overleverage) akan terlihat lebih cepat.</p>
${d}`,
    },
    {
      slug: "broker-ecn-vs-market-maker",
      title: "Broker ECN/STP dan market maker: gambaran singkat",
      excerpt:
        "Perbedaan model eksekusi mempengaruhi spread, kedalaman pasar, dan konflik kepenting. Ini kerangka berpikir, bukan rekomendasi merek.",
      contentHtml: `<h2>Market maker</h2>
<p>Broker tipe ini dapat menjadi pihak lawan order retail atau menginternalisasi aliran order. Spread bisa kompetitif dan eksekusi cepat, tetapi struktur bisnisnya berbeda dengan akses langsung ke likuiditas interbank murni.</p>
<h2>ECN / STP (gambaran umum)</h2>
<p>Model yang sering dipasarkan sebagai ECN atau STP umumnya mengarahkan order ke penyedia likuiditas eksternal. Spread sering variatif (raw) dan komisi terpisah. Slippage tetap bisa terjadi saat volatilitas tinggi atau berita besar.</p>
<h2>Yang perlu Anda bandingkan</h2>
<ul>
<li>Regulasi dan perlindungan dana klien</li>
<li>Biaya total: spread + komisi + swap</li>
<li>Kebijakan eksekusi saat rilis berita</li>
<li>Reputasi dan transparansi</li>
</ul>
<p>Istilah di industri tidak selalu seragam; baca dokumen legal broker masing-masing.</p>
${d}`,
    },
    {
      slug: "spread-komisi-swap-dan-biaya",
      title: "Spread, komisi, swap: memahami biaya trading",
      excerpt:
        "Biaya tidak hanya spread. Swap overnight dan komisi ECN ikut memengaruhi hasil netto, terutama untuk trader jangka panjang.",
      contentHtml: `<h2>Spread</h2>
<p>Selisih bid dan ask adalah biaya implisit setiap kali Anda masuk dan keluar pasar. Spread melebar saat likuiditas tipis atau volatilitas melonjak—misalnya sekitar rilis data ekonomi besar.</p>
<h2>Komisi</h2>
<p>Akun dengan spread &quot;mentah&quot; sering menambahkan komisi per lot side. Hitung biaya per pip atau per putaran penuh agar bisa membandingkan paket akun secara adil.</p>
<h2>Swap (bunga menginap)</h2>
<p>Posisi yang ditahan melewati malam dapat dikenakan atau dikreditkan swap sesuai suku bunga mata uang dalam pasangan. Trader intraday mungkin jarang merasakannya; swing trader harus memperhitungkannya dalam rencana.</p>
<h2>Tip praktis</h2>
<ul>
<li>Simpan screenshot biaya dari halaman spesifikasi simbol broker Anda.</li>
<li>Uji biaya riil di akun demo dengan horizon holding yang mirip gaya Anda.</li>
</ul>
${d}`,
    },
    {
      slug: "psikologi-trading-hindari-overtrading",
      title: "Psikologi trading: kenali overtrading dan FOMO",
      excerpt:
        "Keputusan di bawah emosi sering merusak edge statistik. Kenali pemicu overtrading dan bangun ritual pra-sesi.",
      contentHtml: `<h2>Overtrading</h2>
<p>Membuka terlalu banyak posisi, meningkatkan lot setelah loss, atau trading di luar rencana karena bosan semua termasuk overtrading. Akibatnya: biaya spread/swap menumpuk dan disiplin runtuh.</p>
<h2>FOMO (fear of missing out)</h2>
<p>Mengejar pergerakan yang sudah jauh berjalan tanpa setup jelas sering berujung pada entry di ekstrem harga. Aturan sederhana: jika tidak ada rencana sebelum candle bergerak, tunggu pullback atau lewatkan saja.</p>
<h2>Ritual pra-sesi</h2>
<ul>
<li>Tandai level penting dan skenario (jika A maka B).</li>
<li>Batasi jam aktif trading jika Anda punya pekerjaan lain.</li>
<li>Setelah mencapai target harian (untung atau rugi), pertimbangkan berhenti.</li>
</ul>
<h2>Jeda</h2>
<p>Loss beruntun adalah sinyal untuk mengevaluasi proses, bukan untuk &quot;balas dendam&quot; ke pasar.</p>
${d}`,
    },
    {
      slug: "jadwal-sesi-trading-forex",
      title: "Jadwal sesi trading forex: Sydney hingga New York",
      excerpt:
        "Likuidasi dan karakteristik pasangan berubah tiap sesi. Pahami waktu overlap London–New York untuk volatilitas umumnya lebih tinggi.",
      contentHtml: `<h2>Empat sesi utama</h2>
<p>Pasar forex berjalan 24 jam dari Senin hingga Jumat (waktu server broker Anda bisa sedikit berbeda). Secara garis besar: <strong>Sydney → Tokyo → London → New York</strong>.</p>
<h2>Overlap London–New York</h2>
<p>Periode ketika kedua pusat keuangan besar aktif bersamaan sering menampilkan volume dan volatilitas lebih tinggi pada pasangan seperti EUR/USD dan GBP/USD—bukan jaminan arah, tetapi fluktuasi cenderung lebih hidup.</p>
<h2>Sesi Asia</h2>
<p>Pasangan dengan yen atau dolar Australia kadang lebih aktif saat sesi Tokyo. Range bisa lebih sempit pada beberapa jam tertentu; strategi breakout vs mean reversion perlu disesuaikan.</p>
<h2>Satukan dengan jam lokal Anda</h2>
<p>Catat jam rilis data penting (biasanya dikutip dalam GMT/UTC atau waktu AS) dan konversi ke zona waktu Anda agar tidak kaget saat spread melebar.</p>
${d}`,
    },
    {
      slug: "kalender-ekonomi-dan-forex",
      title: "Kalender ekonomi: cara membaca dampaknya ke forex",
      excerpt:
        "Data makro sering memicu volatilitas. Pahami perbedaan actual vs forecast, revisi data, dan risiko slippage saat rilis.",
      contentHtml: `<h2>Mengapa kalender penting</h2>
<p>Bank sentral dan lembaga statistik merilis data inflasi, tenaga kerja, pertumbuhan, dan kebijakan moneter. Hasil yang menyimpang jauh dari perkiraan pasar sering memicu pergerakan cepat pada mata uang terkait.</p>
<h2>Actual, forecast, previous</h2>
<ul>
<li><strong>Forecast:</strong> konsensus analis sebelum rilis.</li>
<li><strong>Actual:</strong> angka resmi saat dirilis.</li>
<li><strong>Previous:</strong> data periode sebelumnya—kadang direvisi; revisi bisa ikut mempengaruhi interpretasi pasar.</li>
</ul>
<h2>Volatilitas bukan arah</h2>
<p>Berita &quot;lebih baik dari perkiraan&quot; belum tentu membuat mata uang naik jika pasar sudah mem-pricing lebih dulu (buy the rumor, sell the fact). Konteks tren mingguan dan suku bunga relatif tetap relevan.</p>
<h2>Risiko eksekusi</h2>
<p>Sekitar rilis besar, spread bisa melebar dan order mengalami slippage. Banyak trader memilih tidak membuka posisi baru tepat sebelum angka keluar, atau mengurangi ukuran posisi.</p>
<h2>Sumber resmi</h2>
<p>Gunakan kalender dari sumber terpercaya dan silang dengan situs institusi (Fed, ECB, BPS, dll.) untuk konteks. Hindari mengartikan satu headline tanpa membaca nuansa laporan lengkapnya.</p>
${d}`,
    },
    {
      slug: "suku-bunga-inflasi-dan-mata-uang",
      title: "Suku bunga, inflasi, dan daya tarik relatif mata uang",
      excerpt:
        "Kerangka makro sederhana: ekspektasi kebijakan moneter dan inflasi memengaruhi aliran modal antar mata uang—bukan satu-satunya faktor, tetapi fondasi umum.",
      contentHtml: `<h2>Suku bunga riil dan ekspektasi</h2>
<p>Pasar forex sangat responsif terhadap ekspektasi arah suku bunga. Kenaikan suku bunga (atau sikap hawkish bank sentral) sering dibahas bersamaan dengan daya tarik aset berdenominasi mata uang tersebut—dengan banyak pengecualian jangka pendek.</p>
<h2>Inflasi</h2>
<p>Inflasi tinggi tanpa respons kebijakan yang diyakini pasar bisa melemahkan kepercayaan terhadap mata uang; sebaliknya, inflasi terkendali dengan kebijakan konsisten sering menjadi konteks positif relatif.</p>
<h2>Spread suku bunga antar negara</h2>
<p>Pedagang sering memantau perbedaan yield obligasi atau ekspektasi lintas Fed–ECB–BOJ–dll. Perubahan ekspektasi ini bisa mendorong tren jangka menengah pada pasangan mayor.</p>
<h2>Bukan ramalan harga</h2>
<p>Faktor geopolitik, likuiditas global, dan risiko risiko (risk-on/risk-off) juga ikut bermain. Gunakan kerangka ini untuk memahami berita, bukan untuk menebak setiap candle.</p>
${d}`,
    },
  ];
}

/** Penulis artikel seed: user komunitas piphunter jika ada, selain itu admin. */
export async function resolveSeedArticleAuthor(prisma: PrismaClient) {
  const exactSlug = await prisma.user.findUnique({ where: { memberSlug: "piphunter" } });
  if (exactSlug) return exactSlug;

  const byEmail = await prisma.user.findFirst({
    where: { email: { startsWith: "piphunter@", mode: "insensitive" } },
  });
  if (byEmail) return byEmail;

  const slugPrefix = await prisma.user.findFirst({
    where: { memberSlug: { startsWith: "piphunter-" } },
    orderBy: { createdAt: "asc" },
  });
  if (slugPrefix) return slugPrefix;

  return prisma.user.findFirst({ where: { role: Role.ADMIN } });
}

/** Upsert 8 artikel edukasi (status PUBLISHED). Dipakai dari seed penuh atau `npm run db:seed:articles`. */
export async function seedEducationalArticles(prisma: PrismaClient): Promise<void> {
  const articleAuthor = await resolveSeedArticleAuthor(prisma);
  if (!articleAuthor) {
    console.log("Lewati artikel: tidak ada user admin atau piphunter di database ini.");
    return;
  }

  const penulis =
    articleAuthor.memberSlug === "piphunter" ||
    articleAuthor.memberSlug?.startsWith("piphunter-") ||
    articleAuthor.email.toLowerCase().startsWith("piphunter@")
      ? "piphunter"
      : "admin";

  const rows = educationalArticlesHtml();
  const now = new Date();

  for (const a of rows) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      create: {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        contentHtml: a.contentHtml,
        status: ArticleStatus.PUBLISHED,
        authorId: articleAuthor.id,
        publishedAt: now,
      },
      update: {
        title: a.title,
        excerpt: a.excerpt,
        contentHtml: a.contentHtml,
        status: ArticleStatus.PUBLISHED,
        authorId: articleAuthor.id,
        publishedAt: now,
      },
    });
  }

  console.log(
    "Artikel edukasi forex:",
    rows.length,
    "judul · status PUBLISHED · penulis:",
    penulis,
    "(" + (articleAuthor.name ?? articleAuthor.email) + ")"
  );
}
