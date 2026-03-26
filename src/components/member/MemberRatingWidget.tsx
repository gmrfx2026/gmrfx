"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function MemberRatingWidget({
  memberId,
  canRate,
  myStars,
  avgStars,
  ratingCount,
}: {
  memberId: string;
  canRate: boolean;
  myStars: number | null;
  avgStars: number | null;
  ratingCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const displayStars = useMemo(() => {
    if (myStars != null) return myStars;
    if (avgStars == null) return 0;
    return Math.round(avgStars);
  }, [myStars, avgStars]);

  async function rate(stars: number) {
    if (!canRate) return;
    setLoading(true);
    try {
      const res = await fetch("/api/member/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, stars }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Gagal memberi rating");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const shownLabel =
    myStars != null
      ? `Rating Anda: ${myStars}/5`
      : avgStars != null
        ? `Rating: ${avgStars.toFixed(1)}/5 (${ratingCount} penilaian)`
        : "Belum ada penilaian";

  return (
    <div className="mt-2">
      <p className="text-xs text-broker-muted">{shownLabel}</p>
      <div className="mt-1 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = hover != null ? n <= hover : n <= displayStars;
          return (
            <button
              key={n}
              type="button"
              onClick={() => rate(n)}
              onMouseEnter={() => canRate && setHover(n)}
              onMouseLeave={() => canRate && setHover(null)}
              disabled={!canRate || loading}
              aria-label={`Berikan rating ${n} bintang`}
              className={`text-lg leading-none transition ${
                filled ? "text-broker-accent" : "text-broker-muted"
              } ${!canRate ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              ★
            </button>
          );
        })}
      </div>
      {!canRate && (
        <p className="mt-1 text-[10px] text-broker-muted">
          {myStars != null ? "Anda sudah memberi rating." : "Login untuk memberi rating."}
        </p>
      )}
    </div>
  );
}

