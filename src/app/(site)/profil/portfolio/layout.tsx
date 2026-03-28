import type { ReactNode } from "react";
import { PortfolioSubNav } from "@/components/portfolio/PortfolioSubNav";

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <PortfolioSubNav />
      <div className="min-w-0 flex-1 space-y-6">{children}</div>
    </div>
  );
}
