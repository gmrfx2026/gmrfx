"use client";

import { useCallback, useState } from "react";
import clsx from "clsx";
import { useToast } from "@/components/ToastProvider";

function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 13a5 5 0 0 1 7.54.54l3 3a5 5 0 0 1-7.07 7.07l-1.72-1.71" />
      <path d="M14 11a5 5 0 0 1-7.54-.54l-3-3a5 5 0 0 1 7.07-7.07l1.71 1.71" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconTelegramShare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
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

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const btnClass =
  "inline-flex rounded-md border border-broker-border/60 bg-broker-bg/30 p-1 text-broker-muted transition hover:border-broker-accent/40 hover:bg-broker-surface/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-broker-accent";
const iconClass = "h-3.5 w-3.5 sm:h-4 sm:w-4";

export function MemberProfileShare({
  shareUrl,
  shareTitle,
  className = "",
  variant = "belowProfile",
  /** Ikon bagikan ke WhatsApp/Telegram/Facebook/X. Di halaman profil dinonaktifkan agar tidak tercampur dengan tautan sosial milik member. */
  showExternalShareButtons = true,
}: {
  shareUrl: string;
  shareTitle: string;
  className?: string;
  /**
   * `toolbar`: baris atas sejajar breadcrumb (rata kanan).
   * `belowFollow`: bawah tombol Ikuti / login, tengah, jarak atas proporsional.
   */
  variant?: "belowProfile" | "toolbar" | "belowFollow";
  showExternalShareButtons?: boolean;
}) {
  const { show } = useToast();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(shareUrl);
  const text = `${shareTitle} — GMR FX`;
  const encodedText = encodeURIComponent(text);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      show("Tautan disalin.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      show("Gagal menyalin. Salin manual dari bilah alamat.", "err");
    }
  }, [shareUrl, show]);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`,
      Icon: IconWhatsApp,
      hover: "hover:text-emerald-400",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      Icon: IconTelegramShare,
      hover: "hover:text-sky-300",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: IconFacebook,
      hover: "hover:text-sky-400",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      Icon: IconX,
      hover: "hover:text-white",
    },
  ];

  return (
    <div
      className={clsx(
        variant === "toolbar" && "min-w-0 shrink",
        variant === "belowFollow" && "mt-8 w-full sm:mt-10",
        variant === "belowProfile" && "mt-3 w-full",
        className,
      )}
    >
      <div
        className={clsx(
          "flex flex-wrap items-center gap-1.5",
          variant === "toolbar" && "w-full justify-end",
          variant === "belowFollow" && "w-full justify-center md:justify-start",
          variant === "belowProfile" && "justify-center md:justify-start",
        )}
      >
        <button
          type="button"
          onClick={() => void copyLink()}
          className={`${btnClass} gap-1 px-2 py-1 text-xs font-semibold ${copied ? "border-broker-accent/50 text-broker-accent" : ""}`}
          aria-label="Salin tautan profil"
        >
          <IconLink className="h-3.5 w-3.5" />
          {copied ? "Disalin" : "Salin tautan"}
        </button>
        {showExternalShareButtons
          ? links.map(({ label, href, Icon, hover }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnClass} ${hover}`}
                aria-label={`Bagikan ke ${label}`}
              >
                <Icon className={iconClass} />
              </a>
            ))
          : null}
      </div>
    </div>
  );
}
