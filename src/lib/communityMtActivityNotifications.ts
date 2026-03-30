import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { closeKindLabelId, type Mt5CloseKind } from "@/lib/mt5CloseReason";
import type { PositionCloseAlert, PositionOpenAlert, PositionSltpChangeAlert } from "@/lib/mtTradingActivityPositionDiff";

/** Penutupan dari diff + alasan (SL/TP/…) + komentar deal (jika ada). */
export type PositionCloseAlertEnriched = PositionCloseAlert & {
  closeKind: Mt5CloseKind;
  dealComment?: string | null;
};

function communityAccountPath(publisherUserId: string, mtLogin: string): string {
  return `/profil/portfolio/community/account/${encodeURIComponent(publisherUserId)}/${encodeURIComponent(mtLogin)}`;
}

/** Format harga level untuk teks notifikasi (SL/TP). */
export function formatMtSltpForNotification(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const maxFrac = abs >= 1000 ? 2 : abs >= 10 ? 3 : 5;
  let s = n.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  });
  return s.length > 0 ? s : String(n);
}

/** Tampilan tiket di notifikasi: tidak full, cukup beberapa digit akhir. */
function formatMtTicketHint(ticket: string, tailDigits = 4): string {
  const t = String(ticket).trim();
  if (!t) return "—";
  const n = Math.min(Math.max(2, tailDigits), 8);
  if (t.length <= n) return t;
  return `…${t.slice(-n)}`;
}

/** Pair + petunjuk tiket — membedakan beberapa posisi pada symbol yang sama tanpa menampilkan tiket penuh. */
function posRef(symbol: string, ticket: string): string {
  const sym = symbol || "(internal)";
  return `${sym} · tiket ${formatMtTicketHint(ticket)}`;
}

function bodyOpen(o: PositionOpenAlert): string {
  return `Buka ${posRef(o.symbol, o.ticket)} · SL ${formatMtSltpForNotification(o.sl)} · TP ${formatMtSltpForNotification(o.tp)}`;
}

function closeAlertTitle(accountLabel: string, kind: Mt5CloseKind): string {
  switch (kind) {
    case "tp":
      return `${accountLabel}: Take Profit`;
    case "sl_profit":
      return `${accountLabel}: Stop Loss+ (profit)`;
    case "sl":
      return `${accountLabel}: Stop Loss`;
    case "stop_out":
      return `${accountLabel}: Stop out`;
    case "vmargin":
      return `${accountLabel}: Break / VMargin`;
    case "rollover":
      return `${accountLabel}: Rollover`;
    case "split":
      return `${accountLabel}: Split`;
    case "corporate":
      return `${accountLabel}: Aksi korporasi`;
    default:
      return `${accountLabel}: posisi ditutup`;
  }
}

function bodyClose(c: PositionCloseAlertEnriched): string {
  const base = `Tutup ${posRef(c.symbol, c.ticket)} · ${closeKindLabelId(c.closeKind)}`;
  const note = c.dealComment?.trim();
  if (!note) return base;
  return `${base} · komentar: ${note}`;
}

function bodySltp(u: PositionSltpChangeAlert): string {
  const slPart = mtSltpPart("SL", u.wasSl, u.sl);
  const tpPart = mtSltpPart("TP", u.wasTp, u.tp);
  return `Perubahan ${posRef(u.symbol, u.ticket)} · ${slPart} · ${tpPart}`;
}

function mtSltpPart(label: string, was: number | null, now: number | null): string {
  const a = formatMtSltpForNotification(was);
  const b = formatMtSltpForNotification(now);
  if (a === b) return `${label} ${b}`;
  return `${label} ${a} → ${b}`;
}

/** Kirim notifikasi ke member yang menekan "Ikuti" pada akun komunitas ini. */
export async function notifyCommunityMtActivityWatchers(params: {
  publisherUserId: string;
  mtLogin: string;
  displayName: string;
  opened: PositionOpenAlert[];
  closed: PositionCloseAlertEnriched[];
  sltpChanged: PositionSltpChangeAlert[];
}): Promise<void> {
  const { opened, closed, sltpChanged } = params;
  if (opened.length === 0 && closed.length === 0 && sltpChanged.length === 0) return;

  const watchers = await prisma.mtCommunityActivityWatch.findMany({
    where: {
      publisherUserId: params.publisherUserId,
      mtLogin: params.mtLogin,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { followerUserId: true },
  });
  if (watchers.length === 0) return;

  const linkUrl = communityAccountPath(params.publisherUserId, params.mtLogin);
  const label = params.displayName.trim() || "Akun komunitas";

  type Row = {
    userId: string;
    actorId: string;
    type: NotificationType;
    title: string;
    body: string;
    linkUrl: string;
  };

  const rows: Row[] = [];

  for (const o of opened) {
    rows.push(
      ...watchers.map((w) => ({
        userId: w.followerUserId,
        actorId: params.publisherUserId,
        type: NotificationType.COMMUNITY_MT_TRADE_ALERT,
        title: `${label}: posisi baru`,
        body: bodyOpen(o),
        linkUrl,
      }))
    );
  }
  for (const c of closed) {
    rows.push(
      ...watchers.map((w) => ({
        userId: w.followerUserId,
        actorId: params.publisherUserId,
        type: NotificationType.COMMUNITY_MT_TRADE_ALERT,
        title: closeAlertTitle(label, c.closeKind),
        body: bodyClose(c),
        linkUrl,
      }))
    );
  }
  for (const u of sltpChanged) {
    rows.push(
      ...watchers.map((w) => ({
        userId: w.followerUserId,
        actorId: params.publisherUserId,
        type: NotificationType.COMMUNITY_MT_TRADE_ALERT,
        title: `${label}: ubah SL/TP`,
        body: bodySltp(u),
        linkUrl,
      }))
    );
  }

  if (rows.length === 0) return;
  await prisma.notification.createMany({ data: rows });
}

/** Nama tampilan untuk judul notifikasi: nama akun terminal jika ada. */
export async function resolveCommunityMtDisplayName(
  publisherUserId: string,
  mtLogin: string
): Promise<string> {
  const snap = await prisma.mtAccountSnapshot.findFirst({
    where: { userId: publisherUserId, mtLogin },
    orderBy: { recordedAt: "desc" },
    select: { tradeAccountName: true },
  });
  const fromSnap = snap?.tradeAccountName?.trim();
  if (fromSnap) return fromSnap;
  const u = await prisma.user.findUnique({
    where: { id: publisherUserId },
    select: { name: true },
  });
  return u?.name?.trim() ?? "";
}
