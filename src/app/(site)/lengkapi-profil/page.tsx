import { auth } from "@/auth";
import { CompleteProfileForm } from "@/components/CompleteProfileForm";
import { isUserProfileComplete } from "@/lib/profileComplete";
import { redirect } from "next/navigation";

export default async function LengkapiProfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (await isUserProfileComplete(session.user.id)) redirect("/profil");

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
