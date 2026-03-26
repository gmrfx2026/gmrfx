/**
 * Baca kredensial Google OAuth lewat nama env dinamis agar nilai dari Vercel
 * tidak tertinggal karena inlining build-time.
 */
export function getGoogleOAuthEnv(): { clientId: string; clientSecret: string } | null {
  const idKey = ["AUTH", "GOOGLE", "ID"].join("_");
  const secretKey = ["AUTH", "GOOGLE", "SECRET"].join("_");
  const clientId = process.env[idKey];
  const clientSecret = process.env[secretKey];
  if (
    typeof clientId === "string" &&
    clientId.trim() !== "" &&
    typeof clientSecret === "string" &&
    clientSecret.trim() !== ""
  ) {
    return { clientId: clientId.trim(), clientSecret: clientSecret.trim() };
  }
  return null;
}

export function isGoogleOAuthConfigured(): boolean {
  return getGoogleOAuthEnv() !== null;
}
