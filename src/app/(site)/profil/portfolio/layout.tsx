import type { ReactNode } from "react";
import { PortfolioNavMobileStrip } from "@/components/portfolio/PortfolioSubNav";
import { getPortfolioNavConfig } from "@/lib/portfolioMenu";

export const dynamic = "force-dynamic";

export default async function PortfolioLayout({ children }: { children: ReactNode }) {
  const portfolioMenu = await getPortfolioNavConfig();

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="md:hidden">
        <PortfolioNavMobileStrip menu={portfolioMenu} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
