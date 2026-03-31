import Link from "next/link";
import { getFinnhubHomeData } from "@/lib/finnhubHome";
import { formatJakarta } from "@/lib/jakartaDateFormat";

function formatPrice(n: number, label: string): string {
  const crypto = label.startsWith("BTC");
  const decimals = crypto ? 2 : label.startsWith("XAU") ? 2 : 5;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export async function FinnhubMarketSection() {
  const data = await getFinnhubHomeData();
  if (!data) return null;

  const hasQuotes = data.quotes.some((q) => q.current !== null);
  const hasNews = data.news.length > 0;
  if (!hasQuotes && !hasNews) return null;

  return (
    <section
      className="border-t border-broker-border bg-broker-bg/40"
      aria-label="Kutipan pasar dan berita forex"
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">Pasar (cuplikan)</h2>
            <p className="mt-1 max-w-2xl text-sm text-broker-muted">
              Harga acuan dan headline forex — bukan sinyal trading; data tertunda sesuai kebijakan penyedia.
            </p>
          </div>
          <a
            href="https://finnhub.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-broker-accent hover:underline"
          >
            Data: Finnhub →
          </a>
        </div>

        {hasQuotes ? (
          <div className="mb-8 overflow-x-auto pb-1">
            <ul className="flex min-w-0 gap-3 md:grid md:grid-cols-5 md:gap-4">
              {data.quotes.map((q) => (
                <li
                  key={q.symbol}
                  className="min-w-[140px] flex-1 rounded-xl border border-broker-border bg-broker-surface/50 px-4 py-3 md:min-w-0"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-broker-muted">{q.label}</p>
                  {q.current !== null ? (
                    <>
                      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
                        {formatPrice(q.current, q.label)}
                      </p>
                      {q.changePercent !== null ? (
                        <p
                          className={
                            q.changePercent >= 0 ? "mt-0.5 text-xs text-emerald-400" : "mt-0.5 text-xs text-rose-400"
                          }
                        >
                          {q.changePercent >= 0 ? "+" : ""}
                          {q.changePercent.toFixed(2)}%
                          {q.change !== null ? (
                            <span className="text-broker-muted">
                              {" "}
                              ({q.change >= 0 ? "+" : ""}
                              {q.change.toFixed(cryptoDecimals(q.label))})
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-broker-muted">—</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasNews ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-broker-muted">
              Berita forex (eksternal)
            </h3>
            <ul className="space-y-2">
              {data.news.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-0.5 rounded-lg border border-transparent px-1 py-1.5 transition hover:border-broker-border hover:bg-broker-surface/40 sm:flex-row sm:items-baseline sm:gap-3"
                  >
                    <span className="flex-1 text-sm text-white group-hover:text-broker-accent">{n.headline}</span>
                    {n.source ? (
                      <span className="shrink-0 text-xs text-broker-muted">{n.source}</span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-8 text-center text-[11px] text-broker-muted/80">
          Diperbarui sekitar {formatJakarta(new Date(data.fetchedAt), { dateStyle: "short", timeStyle: "short" })} WIB
          (cache ±3 menit). Kutipan bukan dari broker Anda — verifikasi di platform trading.{" "}
          <Link href="/syarat-ketentuan" className="text-broker-accent hover:underline">
            Syarat &amp; ketentuan
          </Link>
        </p>
      </div>
    </section>
  );
}

function cryptoDecimals(label: string): number {
  if (label.startsWith("BTC")) return 2;
  if (label.startsWith("XAU")) return 2;
  return 5;
}
