import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import {
  DEPOSIT_USDT_BSC_ADDRESS_KEY,
  DEPOSIT_USDT_BSC_ENABLED_KEY,
} from "@/lib/depositUsdtSettings";

/** Baca alamat admin dari SystemSetting, fallback ke env var. */
async function getAdminAddress(): Promise<string> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: DEPOSIT_USDT_BSC_ADDRESS_KEY },
  });
  return (row?.value ?? process.env.ADMIN_USDT_BSC_ADDRESS ?? "").trim();
}

/** Cek apakah deposit USDT diaktifkan admin (default: aktif jika alamat sudah diisi). */
async function isDepositEnabled(): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: DEPOSIT_USDT_BSC_ENABLED_KEY },
  });
  // Jika belum pernah diset, anggap aktif selama alamat ada
  return row ? row.value === "1" : true;
}

export const dynamic = "force-dynamic";

// USDT BEP-20 on BSC
const USDT_CONTRACT_BSC = "0x55d398326f99059ff775485246999027b3197955";
// Transfer(address,address,uint256) topic
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// USDT on BSC has 18 decimals
const USDT_DECIMALS = 18;
// Minimum deposit
const MIN_USDT = 1;

function padAddress(addr: string): string {
  return "0x000000000000000000000000" + addr.toLowerCase().replace(/^0x/, "");
}

type VerifyResult =
  | { valid: true; amountUsdt: number }
  | { valid: false; pending: true; error: string }   // TX belum di-mine — boleh coba ulang
  | { valid: false; pending: false; error: string };  // TX gagal / tidak valid — simpan FAILED

/** Verifikasi TX di BSCScan, return jumlah USDT yang masuk ke admin address. */
async function verifyBscUsdtTx(
  txHash: string,
  adminAddress: string
): Promise<VerifyResult> {
  const apiKey = process.env.BSCSCAN_API_KEY ?? "";
  const url =
    `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionReceipt` +
    `&txhash=${txHash}&apikey=${apiKey}`;

  let data: { result?: { status?: string; logs?: Array<{ address: string; topics: string[]; data: string }> } | null };
  try {
    const res = await fetch(url, { cache: "no-store" });
    data = (await res.json()) as typeof data;
  } catch {
    // BSCScan tidak dapat dijangkau — anggap pending agar member bisa coba lagi
    return { valid: false, pending: true, error: "Gagal menghubungi BSCScan, coba beberapa saat lagi" };
  }

  // result === null artinya TX masih pending (belum di-mine), bukan TX gagal
  if (data.result === null || data.result === undefined) {
    return {
      valid: false,
      pending: true,
      error: "Transaksi masih dalam antrian jaringan (pending). Tunggu beberapa menit lalu coba lagi.",
    };
  }

  const receipt = data.result;

  // status "0x0" = TX di-mine tapi gagal (revert) — ini permanen, simpan FAILED
  if (receipt.status !== "0x1") {
    return { valid: false, pending: false, error: "Transaksi gagal di blockchain (status bukan sukses)" };
  }

  const adminPadded = padAddress(adminAddress);

  for (const log of receipt.logs ?? []) {
    if (log.address.toLowerCase() !== USDT_CONTRACT_BSC) continue;
    if (!log.topics[0] || log.topics[0].toLowerCase() !== TRANSFER_TOPIC) continue;
    if (!log.topics[2] || log.topics[2].toLowerCase() !== adminPadded) continue;

    // Decode amount
    const valueBigInt = BigInt(log.data);
    const amountUsdt = Number(valueBigInt) / Math.pow(10, USDT_DECIMALS);
    return { valid: true, amountUsdt };
  }

  return {
    valid: false,
    pending: false,
    error: "Transfer USDT ke alamat deposit tidak ditemukan dalam transaksi ini",
  };
}

/** Ambil kurs USDT/IDR dari CoinGecko (no API key needed for basic). */
async function fetchUsdtIdrRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr",
      { cache: "no-store" }
    );
    const data = (await res.json()) as { tether?: { idr?: number } };
    const rate = data.tether?.idr;
    if (rate && rate > 0) return rate;
  } catch {
    // fallback below
  }
  // Fallback kurs kasar jika CoinGecko down
  return 16000;
}

// POST /api/wallet/usdt-deposit — submit TxHash, auto-verify, kredit saldo
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { txHash?: string };
  try {
    body = (await req.json()) as { txHash?: string };
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const txHash = (body.txHash ?? "").trim().toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(txHash)) {
    return NextResponse.json(
      { error: "Format TxHash tidak valid (harus 0x + 64 karakter hex)" },
      { status: 400 }
    );
  }

  const [adminAddress, depositEnabled] = await Promise.all([
    getAdminAddress(),
    isDepositEnabled(),
  ]);

  if (!depositEnabled) {
    return NextResponse.json(
      { error: "Fitur deposit USDT sedang dinonaktifkan oleh admin" },
      { status: 503 }
    );
  }
  if (!adminAddress) {
    return NextResponse.json(
      { error: "Alamat deposit belum dikonfigurasi — hubungi admin" },
      { status: 503 }
    );
  }

  // Cek apakah TxHash sudah pernah dipakai
  const existing = await prisma.usdtDepositRequest.findUnique({ where: { txHash } });
  if (existing) {
    return NextResponse.json(
      { error: "TxHash ini sudah pernah digunakan" },
      { status: 409 }
    );
  }

  // Verifikasi on-chain
  const verifyResult = await verifyBscUsdtTx(txHash, adminAddress);

  if (!verifyResult.valid) {
    // TX masih pending: jangan simpan ke DB agar member bisa submit ulang setelah dikonfirmasi
    if (verifyResult.pending) {
      return NextResponse.json({ error: verifyResult.error, pending: true }, { status: 422 });
    }

    // TX gagal atau tidak valid secara permanen: simpan sebagai FAILED
    // agar TxHash ini tidak bisa dipakai ulang
    await prisma.usdtDepositRequest.create({
      data: {
        userId,
        txHash,
        network: "bsc",
        amountUsdt: 0,
        rateIdr: 0,
        amountIdr: 0,
        status: "FAILED",
        failReason: verifyResult.error,
      },
    });
    return NextResponse.json({ error: verifyResult.error }, { status: 422 });
  }

  const { amountUsdt } = verifyResult;

  if (amountUsdt < MIN_USDT) {
    await prisma.usdtDepositRequest.create({
      data: {
        userId,
        txHash,
        network: "bsc",
        amountUsdt: new Decimal(amountUsdt.toFixed(6)),
        rateIdr: 0,
        amountIdr: 0,
        status: "FAILED",
        failReason: `Jumlah terlalu kecil (${amountUsdt} USDT, minimum ${MIN_USDT} USDT)`,
      },
    });
    return NextResponse.json(
      { error: `Jumlah deposit terlalu kecil (minimum ${MIN_USDT} USDT)` },
      { status: 422 }
    );
  }

  // Ambil kurs USDT/IDR
  const rateIdr = await fetchUsdtIdrRate();
  const amountIdr = amountUsdt * rateIdr;

  // Atomic: buat record + tambah saldo
  const [deposit] = await prisma.$transaction([
    prisma.usdtDepositRequest.create({
      data: {
        userId,
        txHash,
        network: "bsc",
        amountUsdt: new Decimal(amountUsdt.toFixed(6)),
        rateIdr: new Decimal(rateIdr.toFixed(2)),
        amountIdr: new Decimal(amountIdr.toFixed(2)),
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: new Decimal(amountIdr.toFixed(2)) } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    depositId: deposit.id,
    amountUsdt,
    rateIdr,
    amountIdr: parseFloat(new Decimal(amountIdr.toFixed(2)).toString()),
  });
}

// GET /api/wallet/usdt-deposit — riwayat deposit member
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.usdtDepositRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      txHash: true,
      network: true,
      amountUsdt: true,
      rateIdr: true,
      amountIdr: true,
      status: true,
      failReason: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  // Juga kembalikan alamat deposit admin dan saldo sekarang
  const [user, adminAddress, depositEnabled] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true },
    }),
    getAdminAddress(),
    isDepositEnabled(),
  ]);

  return NextResponse.json({
    adminAddress: depositEnabled ? adminAddress : "",
    enabled: depositEnabled,
    network: "bsc",
    usdtContract: USDT_CONTRACT_BSC,
    balance: user?.walletBalance?.toString() ?? "0",
    deposits: rows.map((r) => ({
      ...r,
      amountUsdt: r.amountUsdt.toString(),
      rateIdr: r.rateIdr.toString(),
      amountIdr: r.amountIdr.toString(),
    })),
  });
}
