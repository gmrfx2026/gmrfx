import { stripHtmlToPlainText } from "@/lib/stripHtml";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Parafrase isi berita (bahasa Indonesia). Perlu `OPENAI_API_KEY`.
 * Mengembalikan HTML aman berisi satu atau beberapa &lt;p&gt;.
 */
export async function paraphraseNewsHtmlFromSource(rawHtml: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY belum diatur di environment.");
  }

  const plain = stripHtmlToPlainText(rawHtml);
  if (!plain || plain.length < 40) {
    throw new Error("Teks sumber terlalu pendek untuk diparafrase.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const body = plain.slice(0, 14_000);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      messages: [
        {
          role: "system",
          content:
            "Anda editor berita. Tulis ulang informasi berikut dalam bahasa Indonesia yang jelas dan ringkas untuk situs edukasi. " +
            "Jangan menyalin kalimat persis dari sumber; gunakan gaya redaksi sendiri. Tetap akurat secara faktual. " +
            "Output HANYA isi paragraf biasa: pisahkan paragraf dengan baris kosong ganda. Tanpa judul, tanpa markdown, tanpa nomor.",
        },
        { role: "user", content: body },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI gagal (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Respons OpenAI kosong.");

  const paras = text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length === 0) {
    return `<p>${escapeHtml(text)}</p>`;
  }
  return paras.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
}
