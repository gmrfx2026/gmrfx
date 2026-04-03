import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXT = new Set(["zip", "ex4", "ex5", "mq4", "mq5"]);

function isVercel() { return process.env.VERCEL === "1"; }
function blobToken() {
  const v = process.env[["BLOB", "READ", "WRITE", "TOKEN"].join("_")];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

// POST /api/penawaran/[id]/deliver — pemenang mengirim file hasil kerja
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const job = await prisma.jobOffer.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Pekerjaan tidak ditemukan" }, { status: 404 });
  if (job.winnerId !== userId) return NextResponse.json({ error: "Hanya pemenang yang bisa mengirim hasil" }, { status: 403 });
  if (!["ASSIGNED", "DELIVERED"].includes(job.status)) return NextResponse.json({ error: "Status pekerjaan tidak memungkinkan pengiriman" }, { status: 409 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Form data tidak valid" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const note = ((formData.get("note") as string | null) ?? "").trim().slice(0, 500);

  if (!file) return NextResponse.json({ error: "File wajib disertakan" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran file maks 20 MB" }, { status: 413 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) return NextResponse.json({ error: "Ekstensi tidak didukung (.zip .ex4 .ex5 .mq4 .mq5)" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const idPart = randomBytes(8).toString("hex");
  const blobName = `jobs/${params.id}/${idPart}.${ext}`;
  const fileName = file.name.slice(0, 255);

  let fileUrl: string;
  const token = blobToken();
  if (token) {
    const blob = await put(blobName, buf, { access: "public", contentType: "application/octet-stream", addRandomSuffix: false, token });
    fileUrl = blob.url;
  } else if (isVercel()) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN belum dikonfigurasi" }, { status: 500 });
  } else {
    const dir = path.join(process.cwd(), "public", "uploads", "jobs", params.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${idPart}.${ext}`), buf);
    fileUrl = `/uploads/jobs/${params.id}/${idPart}.${ext}`;
  }

  const now = new Date();
  const autoReleaseAt = new Date(now.getTime() + 3 * 86_400_000);

  await prisma.$transaction([
    prisma.jobDeliverable.create({
      data: { jobId: params.id, uploadedById: userId, fileName, fileUrl, note: note || null },
    }),
    prisma.jobOffer.update({
      where: { id: params.id },
      data: { status: "DELIVERED", deliveredAt: now, autoReleaseAt },
    }),
  ]);

  return NextResponse.json({ ok: true, fileName, autoReleaseAt });
}
