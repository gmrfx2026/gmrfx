"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export function SummaryDateRangeForm({
  mtLogin,
  from,
  to,
}: {
  mtLogin: string;
  from: string;
  to: string;
}) {
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f = String(fd.get("from") ?? "").slice(0, 10);
    const t = String(fd.get("to") ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return;
    const q = new URLSearchParams({
      mtLogin,
      from: f,
      to: t,
    });
    router.push(`/profil/portfolio/summary?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-broker-muted">
        Dari
        <input
          name="from"
          type="date"
          defaultValue={from}
          className="rounded-lg border border-broker-border/80 bg-broker-bg/50 px-2 py-1.5 font-mono text-xs text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-broker-muted">
        Sampai
        <input
          name="to"
          type="date"
          defaultValue={to}
          className="rounded-lg border border-broker-border/80 bg-broker-bg/50 px-2 py-1.5 font-mono text-xs text-white"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg border border-broker-accent/50 bg-broker-accent/15 px-3 py-1.5 text-xs font-medium text-broker-accent hover:bg-broker-accent/25"
      >
        Terapkan
      </button>
    </form>
  );
}
