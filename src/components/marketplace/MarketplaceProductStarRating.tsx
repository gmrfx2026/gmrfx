"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { ArticleRatingSummary } from "@/components/ArticleRatingSummary";

type Kind = "indicator" | "ea";

export function MarketplaceProductStarRating({
  kind,
  productId,
  avg,
  count,
  myStars,
  isLoggedIn,
  isOwn,
}: {
  kind: Kind;
  productId: string;
  avg: number | null;
  count: number;
  myStars: number | null;
  isLoggedIn: boolean;
  isOwn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const endpoint =
    kind === "indicator" ? "/api/marketplace/indicator-rating" : "/api/marketplace/ea-rating";
  const bodyKey = kind === "indicator" ? "indicatorId" : "eaId";

  async function submitStars(stars: number) {
    if (!isLoggedIn || isOwn || busy) return;
    setBusy(true);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [bodyKey]: productId, stars }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      show(typeof j.error === "string" ? j.error : "Gagal menyimpan rating", "err");
      return;
    }
    show("Rating disimpan");
    router.refresh();
  }

  const displayPick = hover ?? myStars ?? 0;

  return (
    <div className="rounded-xl border border-broker-border/80 bg-broker-surface/25 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-broker-muted">Rating</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-broker-muted">
        <span>Rata-rata:</span>
        <ArticleRatingSummary avg={avg} count={count} />
      </p>

      {isOwn ? (
        <p className="mt-3 text-sm text-broker-muted">Sebagai penjual, Anda tidak dapat menilai produk sendiri.</p>
      ) : !isLoggedIn ? (
        <p className="mt-3 text-sm text-broker-muted">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="font-medium text-broker-accent hover:underline"
          >
            Masuk
          </Link>{" "}
          untuk memberi rating bintang (1–5).
        </p>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-broker-muted">Penilaian Anda — klik bintang:</p>
          <div
            className="mt-2 flex items-center gap-1"
            role="group"
            aria-label="Beri rating 1 sampai 5 bintang"
            onMouseLeave={() => setHover(null)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={busy}
                aria-label={`${n} bintang`}
                aria-pressed={myStars === n}
                className={[
                  "rounded px-1.5 py-1 text-2xl leading-none transition disabled:opacity-50",
                  n <= displayPick ? "text-broker-gold" : "text-broker-muted/35",
                  "hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-broker-accent/60",
                ].join(" ")}
                onMouseEnter={() => setHover(n)}
                onClick={() => void submitStars(n)}
              >
                <span aria-hidden>★</span>
              </button>
            ))}
          </div>
          {myStars != null ? (
            <p className="mt-2 text-xs text-broker-muted">Anda memberi {myStars} bintang. Klik bintang lain untuk mengubah.</p>
          ) : (
            <p className="mt-2 text-xs text-broker-muted">Belum ada penilaian dari Anda.</p>
          )}
        </div>
      )}
    </div>
  );
}
