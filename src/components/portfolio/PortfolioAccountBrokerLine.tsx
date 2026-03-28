import clsx from "clsx";

type Props = {
  brokerName?: string | null;
  brokerServer?: string | null;
  className?: string;
  /**
   * Jika true dan broker/server kosong, tampilkan petunjuk (bukan menghilangkan baris).
   * Dipakai di Portofolio supaya jelas “belum ada data” vs “bug UI”.
   */
  explainIfMissing?: boolean;
};

/** Satu baris: nama broker + server (dari snapshot MetaTrader). */
export function PortfolioAccountBrokerLine({
  brokerName,
  brokerServer,
  className,
  explainIfMissing,
}: Props) {
  const n = brokerName?.trim() ?? "";
  const s = brokerServer?.trim() ?? "";
  if (!n && !s) {
    if (!explainIfMissing) return null;
    return (
      <p className={clsx("text-xs leading-snug text-broker-muted/90", className)}>
        <span className="font-semibold uppercase tracking-wide text-[10px] text-broker-muted">Broker</span>{" "}
        &amp;{" "}
        <span className="font-semibold uppercase tracking-wide text-[10px] text-broker-muted">Server</span>
        {": "}
        belum ada di database. Pastikan migrasi Prisma sudah jalan, lalu{" "}
        <strong className="font-medium text-broker-muted">compile ulang EA</strong>{" "}
        <span className="font-mono text-[10px] text-white/80">GMRFX_TradeLogger</span> versi{" "}
        <span className="font-mono text-[10px]">1.03+</span> dan biarkan EA sinkron sekali.
      </p>
    );
  }

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
