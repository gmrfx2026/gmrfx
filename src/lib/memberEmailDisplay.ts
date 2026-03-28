/**
 * Email hanya boleh tampil lengkap untuk pemilik akun. Untuk pengguna lain, tampilkan versi disamarkan.
 */

/** Menyembunyikan sebagian alamat email untuk ditampilkan ke pengguna lain. */
export function maskEmail(email: string): string {
  const e = email.trim();
  const at = e.indexOf("@");
  if (at < 1) return "***";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1).trim();
  if (!domain) return "***";

  const localVisible =
    local.length <= 1 ? `${local || "*"}*` : `${local.slice(0, 2)}***`;

  const domainParts = domain.split(".").filter(Boolean);
  const tld =
    domainParts.length >= 2 ? (domainParts[domainParts.length - 1] ?? domain) : domainParts[0] ?? domain;
  const domainHead = domainParts[0] ?? domain;
  const domainVisible = domainHead.length === 0 ? "*" : `${domainHead.slice(0, 1)}***`;

  return `${localVisible}@${domainVisible}.${tld}`;
}

/**
 * Email lengkap hanya jika `viewerUserId === ownerUserId`. Selain itu `maskEmail`.
 */
export function memberEmailForViewer(
  email: string | null | undefined,
  ownerUserId: string,
  viewerUserId: string | null | undefined
): string {
  if (!email?.trim()) return "—";
  if (viewerUserId && viewerUserId === ownerUserId) return email.trim();
  return maskEmail(email);
}
