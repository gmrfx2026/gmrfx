import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { resolvedLocalUploadsRoot } from "@/lib/uploadStorage";

export const runtime = "nodejs";

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

function contentTypeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function candidateNames(requested: string): string[] {
  const ext = path.extname(requested).toLowerCase();
  const base = ext ? requested.slice(0, -ext.length) : requested;
  const choices = [requested, `${base}.jpg`, `${base}.jpeg`, `${base}.png`, `${base}.webp`];
  return Array.from(new Set(choices));
}

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  if (!filename || !SAFE_NAME.test(filename)) {
    return NextResponse.json({ error: "File avatar tidak valid." }, { status: 400 });
  }

  const roots = Array.from(
    new Set([
      path.join(resolvedLocalUploadsRoot(), "avatars"),
      path.join(process.cwd(), "public", "uploads", "avatars"),
    ])
  );

  for (const root of roots) {
    for (const name of candidateNames(filename)) {
      try {
        const fullPath = path.join(root, name);
        const buf = await readFile(fullPath);
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": contentTypeFromName(name),
            "Cache-Control": "public, max-age=300, s-maxage=300",
          },
        });
      } catch {
        // lanjut cek kandidat nama/lokasi berikutnya
      }
    }
  }

  return NextResponse.json({ error: "Avatar tidak ditemukan." }, { status: 404 });
}
