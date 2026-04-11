import type { PrismaClient } from "@prisma/client";
import { MemberFollowStatus } from "@prisma/client";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";

/** Token mention user: `{@user:memberSlug}` — hanya Dulur yang diikuti (ACCEPTED). */
const USER_MENTION = /\{@user:([^}]+)\}/g;
const FORBIDDEN_MENTION = /\{@(?:community|event):/i;

export const MAX_STATUS_COMMENT_USER_MENTIONS = 5;

export function extractUserMentionSlugsFromText(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(USER_MENTION.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const slug = m[1]?.trim();
    if (slug) out.push(slug);
  }
  return out;
}

export function assertNoForbiddenMentionTokens(text: string): string | null {
  if (FORBIDDEN_MENTION.test(text)) {
    return "Komentar tidak boleh menandai komunitas atau event.";
  }
  return null;
}

/** Validasi mention sebelum simpan komentar status. */
export async function validateStatusCommentMentions(
  prisma: PrismaClient,
  authorUserId: string,
  content: string
): Promise<string | null> {
  const forbidden = assertNoForbiddenMentionTokens(content);
  if (forbidden) return forbidden;

  const slugs = extractUserMentionSlugsFromText(content);
  const unique = Array.from(new Set(slugs));
  if (unique.length > MAX_STATUS_COMMENT_USER_MENTIONS) {
    return `Maksimal ${MAX_STATUS_COMMENT_USER_MENTIONS} penanda @ SeDulur per komentar.`;
  }
  if (unique.length === 0) return null;

  const rows = await prisma.memberFollow.findMany({
    where: {
      followerId: authorUserId,
      status: MemberFollowStatus.ACCEPTED,
      following: {
        memberSlug: { in: unique },
        ...listablePublicMemberWhere,
      },
    },
    select: { following: { select: { memberSlug: true } } },
  });
  const ok = new Set(
    rows.map((r) => r.following.memberSlug).filter((s): s is string => Boolean(s))
  );
  for (const slug of unique) {
    if (!ok.has(slug)) {
      return `Penanda @ tidak valid atau bukan SeDulur yang kamu ikuti: ${slug}`;
    }
  }
  return null;
}

export type MentionProfile = { memberSlug: string; name: string | null };

/** Peta slug → profil untuk render tautan (komentar lama tetap bisa ditampilkan jika member publik). */
export async function resolveMentionProfilesBySlug(
  prisma: PrismaClient,
  slugs: string[]
): Promise<Map<string, MentionProfile>> {
  const unique = Array.from(new Set(slugs)).filter(Boolean);
  const map = new Map<string, MentionProfile>();
  if (unique.length === 0) return map;

  const users = await prisma.user.findMany({
    where: {
      memberSlug: { in: unique },
      ...listablePublicMemberWhere,
    },
    select: { memberSlug: true, name: true },
  });
  for (const u of users) {
    if (u.memberSlug) {
      map.set(u.memberSlug, { memberSlug: u.memberSlug, name: u.name });
    }
  }
  return map;
}
