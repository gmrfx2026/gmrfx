import type { Metadata } from "next";
import { VerifyPhonePage } from "./VerifyPhoneClient";

export const metadata: Metadata = {
  title: "Verifikasi Nomor WhatsApp — GMR FX",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VerifyPhonePage />;
}
