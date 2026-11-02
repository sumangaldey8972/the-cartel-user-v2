import type { Metadata } from "next";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";

export const metadata: Metadata = { title: "Verify your email — The Cartel" };

export default function VerifyEmailPage() {
  return <VerifyEmailScreen />;
}
