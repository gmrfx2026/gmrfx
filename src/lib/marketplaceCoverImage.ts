/** Path publik gambar sampul indikator/EA (hanya path relatif situs, dicegah open redirect). */
export const MARKETPLACE_COVER_SRC_RE =
  /^\/indikator-assets\/covers\/[a-z0-9-]+\.(svg|png|jpg|jpeg|webp)$/i;

export function isAllowedMarketplaceCoverSrc(src: string | null | undefined): boolean {
  return Boolean(src && MARKETPLACE_COVER_SRC_RE.test(String(src).trim()));
}
