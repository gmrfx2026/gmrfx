"use client";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h2 className="text-xl font-semibold text-white">Terjadi kesalahan</h2>
      <p className="mt-2 text-sm text-broker-muted">
        {error.message || "Silakan coba lagi atau kembali ke beranda."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg"
        >
          Coba lagi
        </button>
        <a href="/" className="rounded-lg border border-broker-border px-4 py-2 text-sm text-broker-muted hover:text-white">
          Beranda
        </a>
      </div>
    </div>
  );
}
