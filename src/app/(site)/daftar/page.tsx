import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";

export default async function DaftarPage() {
  const session = await auth();
  if (session?.user) redirect("/profil");

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-5 sm:py-14">
      <section className="rounded-2xl border border-broker-border/90 bg-broker-surface/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Daftar member
        </h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-broker-muted">
          Lengkapi data alamat dan WhatsApp. Setelah daftar Anda bisa login dengan email & password. Login
          dengan Google dapat ditambahkan oleh pengelola situs.
        </p>
        <RegisterForm />
      </section>
    </div>
  );
}
