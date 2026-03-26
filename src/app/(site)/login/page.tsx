import { auth } from "@/auth";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await auth();
  const googleOn = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const target =
    searchParams.callbackUrl && searchParams.callbackUrl.startsWith("/")
      ? searchParams.callbackUrl
      : "/profil";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-white">Login</h1>
      {session?.user ? (
        <div className="mt-4 rounded-lg border border-broker-border bg-broker-surface/40 p-4 text-sm text-broker-muted">
          Anda sudah login sebagai <span className="text-white">{session.user.email}</span>.
          <div className="mt-3">
            <Link href={target} className="text-broker-accent hover:underline">
              Lanjut ke {target}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-broker-muted">
            Email & password atau Google (jika dikonfigurasi).
          </p>
          <LoginForm callbackUrl={searchParams.callbackUrl} googleEnabled={googleOn} />
        </>
      )}
    </div>
  );
}
