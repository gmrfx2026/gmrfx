/**
 * Tipografi isi artikel: dipakai di halaman baca dan di area teks editor (WYSIWYG).
 * Butuh plugin `@tailwindcss/typography`.
 */

/** Hanya untuk editor: kotak + border (halaman baca tidak memakai ini). */
export const articleEditorShellClass = "rounded-lg border border-broker-border bg-broker-bg";

/**
 * Satu set `prose` + kelas `article-content` untuk gaya di globals.css (blockquote, gambar, jarak).
 * `prose-base` = ukuran baca nyaman (mirip artikel panjang profesional).
 */
export const articleProseTypographyClass =
  "article-content prose prose-base prose-invert max-w-none text-broker-muted prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-broker-accent prose-h3:text-white prose-p:text-broker-muted prose-p:leading-relaxed prose-strong:text-white prose-code:rounded prose-code:bg-broker-surface/80 prose-code:px-1 prose-code:text-sm prose-code:text-broker-accent prose-pre:bg-broker-surface prose-pre:text-zinc-200 prose-li:marker:text-broker-muted prose-hr:border-broker-border/60 prose-img:block prose-img:w-full prose-img:max-w-full prose-img:h-auto prose-img:rounded-xl";

/** Area `.ProseMirror`: tipografi + inset dalam kotak editor. */
export const articleBodyInnerClass = `${articleProseTypographyClass} px-3 py-2`;
