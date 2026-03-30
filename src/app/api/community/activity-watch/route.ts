import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isCommunitySubscriptionActive,
  paidSubscriptionExpiresAt,
} from "@/lib/communitySubscription";
import { Decimal } from "@prisma/client/runtime/library";
import { newTransactionId } from "@/lib/txid";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  publisherUserId: z.string().min(1),
  mtLogin: z.string().min(1).max(32),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerUserId = session.user.id;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { publisherUserId, mtLogin } = parsed.data;
  if (publisherUserId === followerUserId) {
    return NextResponse.json({ error: "Tidak bisa mengikuti akun sendiri" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const pub = await tx.mtCommunityPublishedAccount.findUnique({
        where: { userId_mtLogin: { userId: publisherUserId, mtLogin } },
      });
      if (!pub?.allowWatch) {
        throw new Error("Pemilik akun tidak membuka layanan Ikuti untuk login ini");
      }

      const dup = await tx.mtCommunityActivityWatch.findUnique({
        where: {
          followerUserId_publisherUserId_mtLogin: {
            followerUserId,
            publisherUserId,
            mtLogin,
          },
        },
      });

      if (dup && isCommunitySubscriptionActive(dup.expiresAt)) {
        throw new Error("DUPLICATE_WATCH");
      }

      const price = pub.watchAlertFree ? new Decimal(0) : new Decimal(pub.watchAlertPriceIdr.toString());
      const expiresAt = pub.watchAlertFree ? null : paidSubscriptionExpiresAt();

      if (!pub.watchAlertFree) {
        if (price.lte(0)) throw new Error("Harga alert tidak valid");

        const follower = await tx.user.findUnique({ where: { id: followerUserId } });
        if (!follower?.walletAddress) {
          throw new Error("Lengkapi alamat wallet di profil untuk berlangganan alert berbayar");
        }

        const bal = new Decimal(follower.walletBalance.toString());
        if (bal.lt(price)) {
          throw new Error("Saldo wallet IDR tidak mencukupi");
        }

        const publisher = await tx.user.findUnique({ where: { id: publisherUserId } });
        if (!publisher) throw new Error("Penerbit tidak ditemukan");

        const txId = newTransactionId("WA");
        await tx.user.update({
          where: { id: followerUserId },
          data: { walletBalance: bal.minus(price) },
        });
        await tx.user.update({
          where: { id: publisherUserId },
          data: {
            walletBalance: new Decimal(publisher.walletBalance.toString()).plus(price),
          },
        });
        await tx.walletTransfer.create({
          data: {
            transactionId: txId,
            fromUserId: followerUserId,
            toUserId: publisherUserId,
            amount: price,
            note: `Alert Ikuti (30 hari): MT ${mtLogin}`,
          },
        });
      }

      if (dup) {
        await tx.mtCommunityActivityWatch.update({
          where: { id: dup.id },
          data: {
            paidAmountIdr: price,
            expiresAt,
          },
        });
      } else {
        await tx.mtCommunityActivityWatch.create({
          data: {
            followerUserId,
            publisherUserId,
            mtLogin,
            paidAmountIdr: price,
            expiresAt,
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal menyimpan";
    if (msg === "DUPLICATE_WATCH") {
      return NextResponse.json({ error: "Anda sudah mengikuti aktivitas akun ini" }, { status: 409 });
    }
    console.error("activity-watch POST", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerUserId = session.user.id;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { publisherUserId, mtLogin } = parsed.data;

  try {
    await prisma.mtCommunityActivityWatch.delete({
      where: {
        followerUserId_publisherUserId_mtLogin: {
          followerUserId,
          publisherUserId,
          mtLogin,
        },
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Belum mengikuti atau sudah dihapus" }, { status: 404 });
  }
}
