"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const INTERVAL_MS = 90_000;

/**
 * Memperbarui `memberLastSeenAt` di server saat member (role USER) membuka situs dengan header standar.
 * Interval + saat tab kembali terlihat.
 */
export function MemberPresencePing() {
  const { data: session, status } = useSession();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "USER") {
      return;
    }

    const ping = () => {
      void fetch("/api/profile/activity-ping", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    };

    ping();
    intervalRef.current = setInterval(ping, INTERVAL_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [status, session?.user?.role]);

  return null;
}
