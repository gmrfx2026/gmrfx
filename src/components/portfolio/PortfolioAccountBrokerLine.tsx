import clsx from "clsx";

type Props = {
  brokerName?: string | null;
  brokerServer?: string | null;
  className?: string;
};

/** Satu baris: nama broker + server (dari snapshot MetaTrader). */
export function PortfolioAccountBrokerLine({ brokerName, brokerServer, className }: Props) {
  const n = brokerName?.trim() ?? "";
  const s = brokerServer?.trim() ?? "";
  if (!n && !s) return null;

  return (
    <p className={clsx("text-xs leading-snug text-broker-muted", className)}>
      {n ? (
        <>
          <span className="font-semibold uppercase tracking-wide text-[10px] text-broker-muted">Broker</span>{" "}
          <span className="font-medium text-white/90">{n}</span>
        </>
      ) : null}
      {n && s ? <span className="mx-2 text-broker-border">·</span> : null}
      {s ? (
        <>
          <span className="font-semibold uppercase tracking-wide text-[10px] text-broker-muted">Server</span>{" "}
          <span className="font-mono text-sm text-white/90">{s}</span>
        </>
      ) : null}
    </p>
  );
}
