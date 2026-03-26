export function slugifyNameBase(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Buat slug URL yang stabil dan tidak tabrakan tanpa query tambahan.
 * Kita tambahkan suffix dari userId (deterministik) agar unik.
 */
export function toMemberSlug(name: string | null | undefined, userId: string): string {
  const base = slugifyNameBase(name ?? "member");
  const suffix = String(userId).slice(-6);
  return `${base}-${suffix}`;
}

