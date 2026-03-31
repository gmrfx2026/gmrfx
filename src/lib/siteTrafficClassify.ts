/** Klasifikasi sumber kunjungan untuk agregasi admin (bukan diagnosis SEO pasti). */

export type TrafficEntryType =
  | "direct"
  | "internal"
  | "organic_google"
  | "social"
  | "other_referral"
  | "utm";

const SOCIAL_HOSTS = new Set([
  "facebook.com",
  "m.facebook.com",
  "l.facebook.com",
  "t.co",
  "twitter.com",
  "x.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "wa.me",
  "api.whatsapp.com",
  "web.whatsapp.com",
  "telegram.me",
  "t.me",
  "line.me",
  "threads.net",
  "snapchat.com",
  "pinterest.com",
  "reddit.com",
]);

function normHost(h: string): string {
  return h.replace(/^www\./i, "").toLowerCase();
}

export function classifyPageTraffic(input: {
  referrerUrl: string | null | undefined;
  siteHost: string | null | undefined;
  utmSource: string | null | undefined;
}): { entryType: TrafficEntryType; referrerHost: string | null } {
  if (input.utmSource && String(input.utmSource).trim().length > 0) {
    return { entryType: "utm", referrerHost: null };
  }

  const ref = input.referrerUrl?.trim();
  if (!ref) {
    return { entryType: "direct", referrerHost: null };
  }

  let refHost: string;
  try {
    refHost = normHost(new URL(ref).hostname);
  } catch {
    return { entryType: "direct", referrerHost: null };
  }

  const site = input.siteHost ? normHost(input.siteHost.split(":")[0] ?? input.siteHost) : "";
  if (site && refHost === site) {
    return { entryType: "internal", referrerHost: refHost };
  }

  if (refHost === "localhost" || refHost.endsWith(".localhost")) {
    return { entryType: "internal", referrerHost: refHost };
  }

  if (refHost.includes("google.") || refHost === "google.com") {
    return { entryType: "organic_google", referrerHost: refHost };
  }

  const socialMatch =
    SOCIAL_HOSTS.has(refHost) ||
    Array.from(SOCIAL_HOSTS).some((s) => refHost.endsWith(`.${s}`));
  if (socialMatch) {
    return { entryType: "social", referrerHost: refHost };
  }

  return { entryType: "other_referral", referrerHost: refHost };
}

/** Filter bot kasar — tidak lengkap; mengurangi noise di dashboard. */
export function isLikelyBotUserAgent(ua: string | null): boolean {
  if (!ua || ua.length < 10) return true;
  const u = ua.toLowerCase();
  if (u.includes("googlebot")) return true;
  if (u.includes("bingbot")) return true;
  if (u.includes("yandexbot")) return true;
  if (u.includes("duckduckbot")) return true;
  if (u.includes("baiduspider")) return true;
  if (u.includes("facebookexternalhit")) return true;
  if (u.includes("twitterbot")) return true;
  if (u.includes("linkedinbot")) return true;
  if (u.includes("slackbot")) return true;
  if (u.includes("discordbot")) return true;
  if (u.includes("ahrefsbot")) return true;
  if (u.includes("semrushbot")) return true;
  if (u.includes("dotbot")) return true;
  if (u.includes("petalbot")) return true;
  if (u.includes("headlesschrome")) return true;
  if (u.startsWith("curl/") || u.startsWith("wget/")) return true;
  return false;
}

export function entryTypeLabel(id: TrafficEntryType | string): string {
  switch (id) {
    case "direct":
      return "Langsung / tanpa referrer";
    case "internal":
      return "Dari halaman situs ini";
    case "organic_google":
      return "Google (referrer)";
    case "social":
      return "Media sosial / chat";
    case "other_referral":
      return "Situs lain (referrer)";
    case "utm":
      return "Kampanye UTM";
    default:
      return id;
  }
}
