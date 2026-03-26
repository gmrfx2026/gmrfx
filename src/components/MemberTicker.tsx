"use client";

type MemberRow = { name: string | null; kabupaten: string | null };

export function MemberTicker({ members }: { members: MemberRow[] }) {
  if (!members.length) {
    return (
      <div className="overflow-hidden border-y border-broker-border bg-broker-surface/80 py-2 text-center text-xs text-broker-muted">
        Belum ada member baru.
      </div>
    );
  }

  const text = members
    .map((m) => `${m.name || "Member"} — ${m.kabupaten || "-"}`)
    .join("   •   ");

  return (
    <div className="overflow-hidden border-y border-broker-border bg-gradient-to-r from-broker-surface via-broker-bg to-broker-surface py-2.5">
      <div className="flex items-center gap-3 px-4">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-broker-accent">
          Member baru
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="inline-flex animate-marquee whitespace-nowrap text-sm text-broker-muted">
            <span className="pr-24">{text}</span>
            <span className="pr-24" aria-hidden>
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
