"use client";

import { Suspense } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { PublicTrafficBeacon } from "@/components/analytics/PublicTrafficBeacon";
import { CommunityTradeAlertPoller } from "@/components/CommunityTradeAlertPoller";
import { ToastProvider } from "@/components/ToastProvider";

/** basePath harus sama dengan `basePath` di `src/auth.ts` agar cookie & `/api/auth/session` selaras. */
const AUTH_BASE_PATH = "/api/auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session} basePath={AUTH_BASE_PATH}>
      <ToastProvider>
        {children}
        <Suspense fallback={null}>
          <PublicTrafficBeacon />
        </Suspense>
        <CommunityTradeAlertPoller />
      </ToastProvider>
    </SessionProvider>
  );
}
