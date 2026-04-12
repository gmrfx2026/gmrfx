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

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  if (!filename || !SAFE_NAME.test(filename)) {
    return NextResponse.json({ error: "File avatar tidak valid." }, { status: 400 });
  }

  try {
    const fullPath = path.join(resolvedLocalUploadsRoot(), "avatars", filename);
    const buf = await readFile(fullPath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFromName(filename),
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Avatar tidak ditemukan." }, { status: 404 });
  }
}
