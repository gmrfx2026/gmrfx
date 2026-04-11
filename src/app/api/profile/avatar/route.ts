import { put } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
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

/** `instanceof` Prisma kadang gagal jika client ter-bundle ganda; pakai `code` bila ada. */
function prismaRequestCode(e: unknown): string | undefined {
  if (!e || typeof e !== "object" || !("code" in e)) return undefined;
  const c = (e as { code: unknown }).code;
  return typeof c === "string" ? c : undefined;
}

export async function POST(req: Request) {
  try {
    let session: Session | null;
    try {
      session = await auth();
    } catch (e) {
      console.error("avatar auth", e);
      return NextResponse.json(
        { error: "Sesi tidak valid. Keluar lalu masuk lagi, lalu coba unggah ulang." },
        { status: 401 }
      );
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch (e) {
      console.error("avatar formData", e);
      return NextResponse.json(
        { error: "Gagal membaca unggahan. Perkecil ukuran file atau coba lagi." },
        { status: 400 }
      );
    }
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
    let buf: Buffer;
    try {
      buf = Buffer.from(await file.arrayBuffer());
    } catch (e) {
      console.error("avatar arrayBuffer", e);
      return NextResponse.json({ error: "Gagal membaca isi file. Coba file lain." }, { status: 400 });
    }

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

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: publicUrl },
      });
    } catch (e) {
      console.error("avatar prisma update", e);
      const code = prismaRequestCode(e);
      if (code === "P2025" || (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")) {
        return NextResponse.json(
          { error: "Sesi tidak cocok dengan data di server. Keluar lalu masuk lagi, lalu coba unggah ulang." },
          { status: 409 }
        );
      }
      if (
        e instanceof Prisma.PrismaClientInitializationError ||
        (e instanceof Error && /DATABASE_URL|connect|connection/i.test(e.message))
      ) {
        return NextResponse.json(
          { error: "Database tidak terhubung. Coba lagi sebentar atau hubungi admin." },
          { status: 503 }
        );
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json(
          { error: "Gagal menyimpan foto profil ke database.", prismaCode: e.code },
          { status: 503 }
        );
      }
      if (code && /^P\d/.test(code)) {
        return NextResponse.json(
          { error: "Gagal menyimpan foto profil ke database.", prismaCode: code },
          { status: 503 }
        );
      }
      if (e instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ error: "Data profil tidak valid." }, { status: 400 });
      }
      if (e instanceof Error && e.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          { error: "Konfigurasi server: DATABASE_URL belum diset atau tidak valid." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Gagal menyimpan URL avatar. Cek koneksi database dan log server." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error("avatar POST", e);
    const hint =
      e instanceof Error
        ? e.message.slice(0, 200)
        : typeof e === "string"
          ? e.slice(0, 200)
          : "";
    const dev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat memproses upload.",
        ...(dev && hint ? { hint } : {}),
      },
      { status: 500 }
    );
  }
}
