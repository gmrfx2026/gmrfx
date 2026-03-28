export function PortfolioPlaceholderPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-5 shadow-inner shadow-black/20 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-broker-muted">{children}</div>
    </section>
  );
}
