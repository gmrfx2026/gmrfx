import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "@/components/CompleteProfileForm";

export default async function LengkapiProfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.profileComplete) redirect("/profil");

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-white">Lengkapi profil</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Akun Google memerlukan data WhatsApp dan alamat lengkap sebelum menggunakan fitur member.
      </p>
      <CompleteProfileForm />
    </div>
  );
}
