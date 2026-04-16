import { ARTICLE_IMAGE_SRC_RE, NEWS_IMAGE_SRC_RE } from "@/lib/articleImagePolicy";

const AVATAR_REL_RE = /^avatars\/[a-z0-9]+\.(jpg|jpeg|png|webp)$/i;

const INDICATOR_COVER_REL_RE = /^indicator-covers\/[a-z0-9]+\.(jpg|jpeg|png|webp)$/i;

/** Path relatif di bawah `public/uploads/` — aman untuk `public-file` API. */
export function isPublicUploadRelativePathAllowed(rel: string): boolean {
  const n = rel.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!n || n.includes("..")) return false;
  const pseudo = `/uploads/${n}`;
  if (NEWS_IMAGE_SRC_RE.test(pseudo) || ARTICLE_IMAGE_SRC_RE.test(pseudo)) return true;
  if (AVATAR_REL_RE.test(n)) return true;
  if (INDICATOR_COVER_REL_RE.test(n)) return true;
  return false;
}
