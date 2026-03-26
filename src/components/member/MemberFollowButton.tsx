"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function MemberFollowButton({
  memberId,
  initialFollowing,
}: {
  memberId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      if (following) {
        const res = await fetch(
          `/api/member/follow?followingId=${encodeURIComponent(memberId)}`,
          { method: "DELETE" },
        );
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          show(typeof j.error === "string" ? j.error : "Gagal berhenti mengikuti.", "err");
          return;
        }
        setFollowing(false);
        show("Berhenti mengikuti.");
      } else {
        const res = await fetch("/api/member/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: memberId }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          show(typeof j.error === "string" ? j.error : "Gagal mengikuti.", "err");
          return;
        }
        setFollowing(true);
        show("Mengikuti.");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      className={[
        "mt-3 inline-flex min-w-[7rem] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        following
          ? "border border-broker-border bg-broker-surface/60 text-white hover:bg-broker-surface/80"
          : "bg-broker-accent text-broker-bg hover:bg-broker-accent/90",
      ].join(" ")}
    >
      {busy ? "…" : following ? "Mengikuti" : "Ikuti"}
    </button>
  );
}

export function MemberFollowLoginLink({
  loginCallbackUrl,
}: {
  loginCallbackUrl: string;
}) {
  return (
    <Link
      href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
      className="mt-3 inline-flex min-w-[7rem] items-center justify-center rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg hover:bg-broker-accent/90"
    >
      Ikuti
    </Link>
  );
}
