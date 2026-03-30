/** Teks hero beranda (atas judul, judul, paragraf). Dapat diubah admin di Pengaturan. */

export const HOME_HERO_EYEBROW_KEY = "home_hero_eyebrow";
export const HOME_HERO_TITLE_KEY = "home_hero_title";
export const HOME_HERO_SUBTEXT_KEY = "home_hero_subtext";

const MAX_EYEBROW = 120;
const MAX_TITLE = 400;
const MAX_SUBTEXT = 4000;

export const HOME_HERO_DEFAULTS = {
  eyebrow: "Komunitas trader",
  title: "Wadah berkomunikasi, belajar, dan berbagi strategi trading",
  subtext:
    "Menghubungkan trader dalam satu wadah: diskusi, materi edukasi, berita pasar, indikator & Expert Advisor. Ruang untuk saling menguatkan pemahaman, ide dan strategi.",
} as const;

function pick(raw: string | null | undefined, fallback: string, max: number): string {
  const t = raw?.trim();
  if (!t) return fallback;
  return t.length > max ? t.slice(0, max) : t;
}

export function resolveHomeHeroFromSettings(values: {
  eyebrow: string | null | undefined;
  title: string | null | undefined;
  subtext: string | null | undefined;
}): { eyebrow: string; title: string; subtext: string } {
  return {
    eyebrow: pick(values.eyebrow, HOME_HERO_DEFAULTS.eyebrow, MAX_EYEBROW),
    title: pick(values.title, HOME_HERO_DEFAULTS.title, MAX_TITLE),
    subtext: pick(values.subtext, HOME_HERO_DEFAULTS.subtext, MAX_SUBTEXT),
  };
}

export function clampHomeHeroEyebrow(s: string): string {
  return s.trim().slice(0, MAX_EYEBROW);
}
export function clampHomeHeroTitle(s: string): string {
  return s.trim().slice(0, MAX_TITLE);
}
export function clampHomeHeroSubtext(s: string): string {
  return s.trim().slice(0, MAX_SUBTEXT);
}
