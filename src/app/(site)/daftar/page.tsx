import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";

export default async function DaftarPage() {
  const session = await auth();
  if (session?.user) redirect("/profil");

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-white">Daftar member</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Lengkapi data alamat dan WhatsApp. Setelah daftar Anda bisa login dengan email & password. Login
        dengan Google dapat ditambahkan oleh pengelola situs.
      </p>
      <RegisterForm />
    </div>
  );
}
