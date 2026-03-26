/** Ringkasan rating artikel (ikon bintang + angka), untuk header halaman artikel. */
export function ArticleRatingSummary({
  avg,
  count,
}: {
  avg: number | null;
  count: number;
}) {
  if (avg == null || count < 1) {
    return <span className="text-broker-muted">· Belum ada rating</span>;
  }
  const rounded = Math.round(avg);
  return (
    <span
      className="ml-2 inline-flex flex-wrap items-center gap-1 text-broker-gold"
      title={`${avg.toFixed(1)} / 5 · ${count} penilaian`}
    >
      <span className="sr-only">
        Rating {avg.toFixed(1)} dari 5, {count} penilaian
      </span>
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? "text-broker-gold" : "text-broker-muted/50"}>
            ★
          </span>
        ))}
      </span>
      <span className="text-xs font-normal text-broker-muted">
        {avg.toFixed(1)} · {count} penilaian
      </span>
    </span>
  );
}
