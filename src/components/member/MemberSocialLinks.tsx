function IconTikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64v-3.5a6.37 6.37 0 0 0-1-.09A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.14-5.1V9.66a8.16 8.16 0 0 0 4.77 1.52v-3.5a4.85 4.85 0 0 1-1-.99z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 4.16 16.15 4 11.95 4h-4.35M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m5.5-3.5a1.2 1.2 0 0 1 1.2 1.2 1.2 1.2 0 0 1-1.2 1.2 1.2 1.2 0 0 1-1.2-1.2 1.2 1.2 0 0 1 1.2-1.2z" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1c-.55 0-1 .45-1 1V12h3l-.5 3H14v6.95c4.56-.93 8-4.96 8-9.95z" />
    </svg>
  );
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

const iconClass = "h-5 w-5";

const linkBase =
  "inline-flex rounded-lg border border-broker-border/60 bg-broker-bg/30 p-2 text-broker-muted transition hover:border-broker-accent/40 hover:bg-broker-surface/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-broker-accent";

export type MemberSocialLinksProps = {
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  telegramUrl?: string | null;
  className?: string;
};

export function MemberSocialLinks({
  tiktokUrl,
  instagramUrl,
  facebookUrl,
  telegramUrl,
  className = "",
}: MemberSocialLinksProps) {
  const items: { href: string; label: string; Icon: typeof IconTikTok; hoverClass: string }[] = [];

  if (tiktokUrl?.trim()) {
    items.push({
      href: tiktokUrl.trim(),
      label: "TikTok",
      Icon: IconTikTok,
      hoverClass: "hover:text-white",
    });
  }
  if (instagramUrl?.trim()) {
    items.push({
      href: instagramUrl.trim(),
      label: "Instagram",
      Icon: IconInstagram,
      hoverClass: "hover:text-pink-400",
    });
  }
  if (facebookUrl?.trim()) {
    items.push({
      href: facebookUrl.trim(),
      label: "Facebook",
      Icon: IconFacebook,
      hoverClass: "hover:text-sky-400",
    });
  }
  if (telegramUrl?.trim()) {
    items.push({
      href: telegramUrl.trim(),
      label: "Telegram",
      Icon: IconTelegram,
      hoverClass: "hover:text-sky-300",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map(({ href, label, Icon, hoverClass }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkBase} ${hoverClass}`}
          aria-label={label}
        >
          <Icon className={iconClass} />
        </a>
      ))}
    </div>
  );
}
