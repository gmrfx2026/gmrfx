/** Bintang ringkas untuk kartu katalog (hanya baca). */
export function MarketplaceRatingBadge({
  avg,
  count,
}: {
  avg: number | null;
  count: number;
}) {
  if (count < 1 || avg == null) {
    return <span className="text-[10px] text-broker-muted/80">Belum ada rating</span>;
  }
  const rounded = Math.round(avg);
  return (
    <span
      className="inline-flex items-center gap-0.5 text-broker-gold"
      title={`${avg.toFixed(1)} / 5 · ${count} penilaian`}
    >
      <span className="sr-only">
        Rating {avg.toFixed(1)} dari 5, {count} penilaian
      </span>
      <span aria-hidden className="inline-flex items-center gap-px text-sm leading-none">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? "text-broker-gold" : "text-broker-muted/35"}>
            ★
          </span>
        ))}
      </span>
      <span className="ml-1 text-[10px] font-medium text-broker-muted">
        {avg.toFixed(1)} ({count})
      </span>
    </span>
  );
}
