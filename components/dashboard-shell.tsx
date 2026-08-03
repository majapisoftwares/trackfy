import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";

export function DashboardShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={`home-dashboard dashboard-page min-h-screen bg-background text-foreground ${wide ? "dashboard-wide" : ""}`}><AppSidebar /><Header dashboard /><div className="dashboard-main">{children}</div></main>;
}
