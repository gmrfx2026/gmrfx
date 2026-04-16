/**
 * Ekstrak bagian file dari FormData App Router / Node.
 * `instanceof File` sering gagal (dua konstruktor berbeda atau nilai Blob murni),
 * padahal unggahan valid — gunakan duck-typing lewat Blob + nama file.
 */
export type ExtractedMultipartPart = { blob: Blob; fileName: string };

export function extractMultipartPart(entry: FormDataEntryValue | null): ExtractedMultipartPart | null {
  if (entry == null || typeof entry === "string") return null;
  if (typeof Blob === "undefined" || !(entry instanceof Blob) || entry.size === 0) return null;
  const fileName =
    typeof File !== "undefined" && entry instanceof File && entry.name.trim() !== ""
      ? entry.name
      : "upload.bin";
  return { blob: entry, fileName };
}

/** Pastikan ada `File` dengan nama untuk API yang mengharapkan `file.name` (ekstensi, dll.). */
export function toFileWithName(part: ExtractedMultipartPart): File {
  if (typeof File !== "undefined" && part.blob instanceof File) return part.blob;
  if (typeof File === "undefined") {
    throw new Error("Lingkungan tidak mendukung konstruktor File");
  }
  return new File([part.blob], part.fileName, { type: part.blob.type || "application/octet-stream" });
}
