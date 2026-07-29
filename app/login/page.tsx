import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Entrar — Trackfy",
  description: "Acesse sua conta na Trackfy.",
};

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
