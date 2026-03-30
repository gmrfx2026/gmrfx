type SendEmailOpts = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Email transaksional lewat Resend (HTTPS, tanpa dependensi tambahan).
 * Set `RESEND_API_KEY` dan `EMAIL_FROM` (mis. "GMR FX <noreply@domain.com>").
 */
export async function sendTransactionalEmail(
  opts: SendEmailOpts
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key) {
    console.warn("sendTransactionalEmail: RESEND_API_KEY tidak di-set; email dilewati.");
    return { ok: false, reason: "missing RESEND_API_KEY" };
  }
  if (!from) {
    console.warn("sendTransactionalEmail: EMAIL_FROM tidak di-set; email dilewati.");
    return { ok: false, reason: "missing EMAIL_FROM" };
  }

  const html = opts.html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(opts.text)}</pre>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("sendTransactionalEmail Resend HTTP", res.status, errText);
      return { ok: false, reason: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("sendTransactionalEmail", e);
    return { ok: false, reason: "fetch failed" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
