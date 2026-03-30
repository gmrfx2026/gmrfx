/** Profil publik default untuk berita tanpa `authorId` (impor RSS, redaksi). */
export const DEFAULT_HOME_NEWS_AUTHOR_SLUG = "gmr-fx-91fd0f";

export const DEFAULT_HOME_NEWS_AUTHOR_LABEL = "GMR Fx";

export type HomeNewsAuthorForUi = {
  name: string | null;
  memberSlug: string | null;
  id: string;
} | null;

/**
 * Penulis tampilan: jika `author` ada dipakai nama + tautan profil; jika tidak, default GMR Fx.
 */
export function homeNewsAuthorForDisplay(author: HomeNewsAuthorForUi): {
  label: string;
  href: string;
} {
  if (author) {
    const label = author.name?.trim() || "Penulis";
    if (author.memberSlug) return { label, href: `/${author.memberSlug}` };
    return { label, href: `/member/${author.id}` };
  }
  return { label: DEFAULT_HOME_NEWS_AUTHOR_LABEL, href: `/${DEFAULT_HOME_NEWS_AUTHOR_SLUG}` };
}
