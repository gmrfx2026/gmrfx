"use client";

import { SessionProvider } from "next-auth/react";
import { CommunityTradeAlertPoller } from "@/components/CommunityTradeAlertPoller";
import { ToastProvider } from "@/components/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <CommunityTradeAlertPoller />
      </ToastProvider>
    </SessionProvider>
  );
}
