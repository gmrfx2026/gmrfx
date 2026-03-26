/** Teks biasa tanpa HTML — tanpa dependensi berat (hindari isomorphic-dompurify di route API). */
export function sanitizePlainText(text: string, maxLen: number): string {
  return text.replace(/[<>]/g, "").trim().slice(0, maxLen);
}
