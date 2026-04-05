export const OAUTH_PHONE_VERIFY_KEY = "oauth_phone_verify_required";

export function isOauthPhoneVerifyRequired(value: string | null | undefined): boolean {
  // default: false (tidak wajib)
  return value === "1";
}
