/** Tampilkan strip "Member baru" di beranda (`HomePageContent`). Nilai: "1" / "0". Default = tampil jika belum diset. */
export const HOME_MEMBER_TICKER_VISIBLE_KEY = "home_member_ticker_visible";

export function isHomeMemberTickerVisible(value: string | null | undefined): boolean {
  if (value == null || value === "") return true;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
