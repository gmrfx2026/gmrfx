"use client";

import Link from "next/link";
import type { MentionProfile } from "@/lib/statusCommentMentions";

/** Render komentar dengan tautan untuk token `{@user:memberSlug}`. */
export function StatusCommentBody({
  content,
  mentionsBySlug,
  className,
}: {
  content: string;
  mentionsBySlug: Record<string, MentionProfile>;
  className?: string;
}) {
  const parts = content.split(/(\{@user:[^}]+\})/g);
  return (
    <div className={className}>
      {parts.map((part, i) => {
        const m = /^\{@user:([^}]+)\}$/.exec(part);
        if (m) {
          const slug = m[1].trim();
          const prof = mentionsBySlug[slug];
          if (prof) {
            const label = prof.name?.trim() || prof.memberSlug;
            return (
              <Link
                key={`m-${slug}-${i}`}
                href={`/${prof.memberSlug}`}
                className="font-medium text-broker-accent hover:underline"
              >
                @{label}
              </Link>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
