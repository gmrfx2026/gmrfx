/** Sisipkan teks pada rentang seleksi; kembalikan teks baru dan posisi kursor. */
export function insertTextAtSelection(
  value: string,
  start: number,
  end: number,
  insert: string
): { next: string; caret: number } {
  const a = Math.max(0, Math.min(start, value.length));
  const b = Math.max(0, Math.min(end, value.length));
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const next = value.slice(0, lo) + insert + value.slice(hi);
  const caret = lo + insert.length;
  return { next, caret };
}
