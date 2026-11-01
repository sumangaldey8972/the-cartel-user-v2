import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Create an account — The Cartel" };

export default function SignUpPage() {
  return <AuthScreen mode="sign-up" />;
}
