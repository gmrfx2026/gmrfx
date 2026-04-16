import { createReadStream } from "fs";
import { open, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { fileExtForArticleType, sniffArticleImageType } from "@/lib/articleImagePolicy";
import { isPublicUploadRelativePathAllowed } from "@/lib/publicFileAllowlist";

export const runtime = "nodejs";

function contentTypeForExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  return "image/jpeg";
}

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rel = segments.join("/");
  if (!isPublicUploadRelativePathAllowed(rel)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const abs = path.join(process.cwd(), "public", "uploads", ...segments);
  const resolved = path.resolve(abs);
  const root = path.resolve(process.cwd(), "public", "uploads");
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let st;
  try {
    st = await stat(resolved);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!st.isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fh = await open(resolved, "r");
  const head = Buffer.alloc(12);
  await fh.read(head, 0, 12, 0);
  await fh.close();
  const kind = sniffArticleImageType(head);
  if (!kind) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(resolved).replace(/^\./, "").toLowerCase();
  const expectedExt = fileExtForArticleType(kind);
  if (ext !== expectedExt && !(expectedExt === "jpg" && ext === "jpeg")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stream = createReadStream(resolved);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": contentTypeForExt(expectedExt),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
