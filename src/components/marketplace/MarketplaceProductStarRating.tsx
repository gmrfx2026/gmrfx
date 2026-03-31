"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { MarketplaceRatingBadge } from "@/components/marketplace/MarketplaceRatingBadge";

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
  const showAggregate = count > 0 && avg != null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-broker-border/80 bg-broker-surface/25 px-4 py-3">
      {showAggregate ? <MarketplaceRatingBadge avg={avg} count={count} /> : null}

      {isOwn ? (
        <span className="text-xs text-broker-muted/90">Penjual tidak dapat menilai produk sendiri.</span>
      ) : !isLoggedIn ? (
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          className="text-sm font-medium text-broker-accent hover:underline"
        >
          Masuk untuk menilai
        </Link>
      ) : (
        <div
          className="flex items-center gap-1"
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
      )}
    </div>
  );
}
