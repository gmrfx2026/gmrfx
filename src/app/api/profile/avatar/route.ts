import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isVercelDeploy, resolvedBlobReadWriteToken } from "@/lib/uploadStorage";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

/** Beberapa browser (terutama Windows) mengirim type kosong; andalkan ekstensi nama file. */
function resolveImageKind(file: File): { ext: string; contentType: string } | null {
  let t = (file.type || "").trim().toLowerCase();
  if (t === "image/pjpeg") t = "image/jpeg";

  if (!t || !ALLOWED.has(t)) {
    const n = file.name.toLowerCase();
    if (n.endsWith(".png")) t = "image/png";
    else if (n.endsWith(".webp")) t = "image/webp";
    else if (n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".jfif")) t = "image/jpeg";
    else return null;
  }

  if (!ALLOWED.has(t)) return null;

  if (t === "image/png") return { ext: "png", contentType: "image/png" };
  if (t === "image/webp") return { ext: "webp", contentType: "image/webp" };
  return { ext: "jpg", contentType: "image/jpeg" };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ada" }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Maksimal 2MB" }, { status: 400 });
    }

    const kind = resolveImageKind(file);
    if (!kind) {
      return NextResponse.json(
        { error: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    const name = `${session.user.id}.${kind.ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const token = resolvedBlobReadWriteToken();
    let publicUrl: string;

    if (token) {
      try {
        const blob = await put(`avatars/${name}`, buf, {
          access: "public",
          contentType: kind.contentType,
          addRandomSuffix: false,
          allowOverwrite: true,
          token,
        });
        publicUrl = blob.url;
      } catch (e) {
        console.error("avatar blob upload", e);
        const msg = e instanceof Error ? e.message : String(e);
        const hint =
          msg.includes("No token found") || msg.includes("BLOB_READ_WRITE_TOKEN")
            ? "Env BLOB_READ_WRITE_TOKEN belum terset untuk environment ini (Production vs Preview). Cek Settings → Environment Variables lalu redeploy."
            : "Gagal mengunggah ke Vercel Blob. Cek Logs dan pengaturan store.";
        return NextResponse.json({ error: hint }, { status: 502 });
      }
    } else if (isVercelDeploy()) {
      return NextResponse.json(
        {
          error:
            "Avatar membutuhkan Vercel Blob: di proyek ini belum ada BLOB_READ_WRITE_TOKEN untuk Production. Buka Settings → Environment Variables (centang Production), atau Storage → Blob → Connect to Project, lalu redeploy.",
        },
        { status: 503 }
      );
    } else {
      try {
        const dir = path.join(process.cwd(), "public", "uploads", "avatars");
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, name), buf);
        publicUrl = `/uploads/avatars/${name}`;
      } catch (e) {
        console.error("avatar local write", e);
        return NextResponse.json(
          { error: "Gagal menyimpan file ke disk (penyimpanan lokal)." },
          { status: 503 }
        );
      }
    }

    /** Cache-buster: nama file selalu sama (userId.ext) sehingga browser cache foto lama — tambahkan ?v=<ts>. */
    const versionedUrl = `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: versionedUrl },
    });

    return NextResponse.json({ ok: true, url: versionedUrl });
  } catch (e) {
    console.error("avatar POST", e);
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses upload." }, { status: 500 });
  }
}
