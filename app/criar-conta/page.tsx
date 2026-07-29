import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Criar conta — Trackfy",
  description: "Crie sua conta na Trackfy.",
};

export default function CreateAccountPage() {
  return <AuthScreen mode="register" />;
}
