"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export type FollowButtonState = "none" | "pending" | "following";

export function MemberFollowButton({
  memberId,
  followState,
  targetRequiresApproval,
}: {
  memberId: string;
  followState: FollowButtonState;
  targetRequiresApproval: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [state, setState] = useState<FollowButtonState>(followState);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(followState);
  }, [followState]);

  async function unfollowOrCancel() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/member/follow?followingId=${encodeURIComponent(memberId)}`,
        { method: "DELETE" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal.", "err");
        return;
      }
      setState("none");
      show(state === "pending" ? "Permintaan dibatalkan." : "Berhenti mengikuti.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function follow() {
    setBusy(true);
    try {
      const res = await fetch("/api/member/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: memberId }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        state?: string;
      };
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal mengikuti.", "err");
        return;
      }
      if (j.state === "pending") {
        setState("pending");
        show("Permintaan terkirim. Tunggu persetujuan.");
      } else {
        setState("following");
        show("Mengikuti.");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (state === "following") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void unfollowOrCancel()}
        className="mt-3 inline-flex min-w-[7rem] items-center justify-center rounded-lg border border-broker-border bg-broker-surface/60 px-4 py-2 text-sm font-semibold text-white transition hover:bg-broker-surface/80 disabled:opacity-50"
      >
        {busy ? "…" : "Mengikuti"}
      </button>
    );
  }

  if (state === "pending") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void unfollowOrCancel()}
        className="mt-3 inline-flex min-w-[7rem] items-center justify-center rounded-lg border border-dashed border-broker-accent/50 bg-broker-bg/50 px-4 py-2 text-sm font-semibold text-broker-accent hover:bg-broker-accent/10 disabled:opacity-50"
      >
        {busy ? "…" : "Menunggu persetujuan"}
      </button>
    );
  }

  const label = targetRequiresApproval ? "Minta mengikuti" : "Ikuti";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void follow()}
      className="mt-3 inline-flex min-w-[7rem] items-center justify-center rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg hover:bg-broker-accent/90 disabled:opacity-50"
    >
      {busy ? "…" : label}
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
