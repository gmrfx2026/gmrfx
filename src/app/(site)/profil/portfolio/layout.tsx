import type { ReactNode } from "react";
import { PortfolioNavMobileStrip } from "@/components/portfolio/PortfolioSubNav";

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="md:hidden">
        <PortfolioNavMobileStrip />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
