import type { Metadata } from "next";
import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Lupa Password — GMR FX",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForgotPasswordClient />;
}
