import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { isVercelDeploy, resolvedBlobReadWriteToken } from "@/lib/uploadStorage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["application/pdf"]);
const ALLOWED_EXT = new Set(["pdf"]);

// POST /api/penawaran/upload-attachment — upload PDF lampiran spesifikasi pekerjaan
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Form data tidak valid" }, { status: 400 });

  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File wajib disertakan" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran file PDF maks 10 MB" }, { status: 413 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) return NextResponse.json({ error: "Hanya file PDF yang diizinkan" }, { status: 400 });

  // Validasi MIME type dari header (tidak 100% terpercaya, tapi cukup untuk UX)
  if (file.type && !ALLOWED_TYPES.has(file.type) && file.type !== "application/octet-stream") {
    return NextResponse.json({ error: "File harus berformat PDF" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Cek magic bytes PDF: harus diawali %PDF
  if (buf.slice(0, 4).toString("ascii") !== "%PDF") {
    return NextResponse.json({ error: "File bukan PDF yang valid" }, { status: 400 });
  }

  const idPart = randomBytes(8).toString("hex");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const blobName = `penawaran-attachments/${session.user.id}/${idPart}.pdf`;

  let fileUrl: string;
  const token = resolvedBlobReadWriteToken();

  if (token) {
    const blob = await put(blobName, buf, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      token,
    });
    fileUrl = blob.url;
  } else if (isVercelDeploy()) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN belum dikonfigurasi" }, { status: 500 });
  } else {
    const dir = path.join(process.cwd(), "public", "uploads", "penawaran-attachments", session.user.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${idPart}.pdf`), buf);
    fileUrl = `/uploads/penawaran-attachments/${session.user.id}/${idPart}.pdf`;
  }

  return NextResponse.json({ ok: true, url: fileUrl, fileName: safeName });
}
