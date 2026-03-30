import type { Metadata } from "next";
import { Suspense } from "react";
import { GoOutClient } from "./GoOutClient";

export const metadata: Metadata = {
  title: "Mitra broker — GMR FX",
  robots: { index: false, follow: false },
};

export default function GoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <Suspense fallback={<p className="text-center text-sm text-zinc-400">Memuat…</p>}>
        <GoOutClient />
      </Suspense>
    </div>
  );
}
