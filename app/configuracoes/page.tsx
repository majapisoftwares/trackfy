import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SettingsScreen } from "@/components/settings-screen";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";

export default async function SettingsPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await findAuthUserBySessionToken(token) : null;
  if (!user) redirect("/login");

  return <><main className="settings-page"><Header /><SettingsScreen user={user} /></main><Footer /></>;
}
