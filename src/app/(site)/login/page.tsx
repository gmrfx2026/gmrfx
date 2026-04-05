import { auth } from "@/auth";
import { isGoogleOAuthConfigured } from "@/lib/googleOAuthEnv";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login — GMR FX",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; registered?: string };
}) {
  const session = await auth();
  const googleOn = isGoogleOAuthConfigured();
  const target =
    searchParams.callbackUrl && searchParams.callbackUrl.startsWith("/")
      ? searchParams.callbackUrl
      : "/profil";
  const justRegistered = searchParams.registered === "1";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-5 sm:py-14">
      <section className="rounded-2xl border border-broker-border/90 bg-broker-surface/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">Login</h1>
        {justRegistered && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Pendaftaran berhasil! Akun Anda sudah aktif. Silakan login.
          </div>
        )}
        {session?.user ? (
          <div className="mt-5 rounded-xl border border-broker-border/70 bg-broker-bg/30 p-4 text-sm leading-relaxed text-broker-muted">
            Anda sudah login sebagai <span className="text-white">{session.user.email}</span>.
            <div className="mt-4">
              <Link
                href={target}
                className="inline-flex rounded-lg bg-broker-accent/15 px-4 py-2 text-sm font-semibold text-broker-accent transition hover:bg-broker-accent/25"
              >
                Lanjut ke {target}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-broker-muted">
              {googleOn
                ? "Masuk dengan email & password atau lanjut dengan Google."
                : "Masuk dengan email & password."}
            </p>
            <LoginForm callbackUrl={searchParams.callbackUrl} googleEnabled={googleOn} />
          </>
        )}
      </section>
    </div>
  );
}
