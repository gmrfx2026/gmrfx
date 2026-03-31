"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { PublicTrafficBeacon } from "@/components/analytics/PublicTrafficBeacon";
import { CommunityTradeAlertPoller } from "@/components/CommunityTradeAlertPoller";
import { ToastProvider } from "@/components/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
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
