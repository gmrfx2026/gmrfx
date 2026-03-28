import { auth } from "@/auth";
import { CompleteProfileForm } from "@/components/CompleteProfileForm";
import { isUserProfileComplete } from "@/lib/profileComplete";
import { redirect } from "next/navigation";

export default async function LengkapiProfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (await isUserProfileComplete(session.user.id)) redirect("/profil");

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-5 sm:py-14">
      <section className="rounded-2xl border border-broker-border/90 bg-broker-surface/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Lengkapi profil
        </h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-broker-muted">
          Akun Google memerlukan data WhatsApp dan alamat lengkap sebelum menggunakan fitur member.
        </p>
        <CompleteProfileForm />
      </section>
    </div>
  );
}
