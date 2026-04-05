export const OAUTH_PHONE_VERIFY_KEY = "oauth_phone_verify_required";
export const MANUAL_PHONE_VERIFY_KEY = "manual_phone_verify_required";

export function isOauthPhoneVerifyRequired(value: string | null | undefined): boolean {
  // default: false (tidak wajib)
  return value === "1";
}

export function isManualPhoneVerifyRequired(value: string | null | undefined): boolean {
  // default: true (wajib) — perilaku lama tetap terjaga
  return value !== "0";
}
