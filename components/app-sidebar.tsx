"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookCheck, CalendarDays, CircleHelp, Flame, History, House, PanelLeftClose, PanelLeftOpen, Settings, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/src/lib/auth/client";

const publicItems = [
  { href: "/", label: "Início", icon: House },
  { href: "/populares", label: "Populares", icon: Flame },
];

const authenticatedItems = [
  { href: "/episodios-para-assistir", label: "Calendário", icon: CalendarDays },
  { href: "/minha-lista", label: "Minha lista", icon: BookCheck },
  { href: "/arquivados", label: "Histórico", icon: History },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const session = useAuthSession();
  const isAuthenticated = Boolean(session.data?.user);

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    document.documentElement.style.setProperty("--dashboard-sidebar-width", collapsed ? "72px" : "208px");
    return () => {
      document.documentElement.style.removeProperty("--dashboard-sidebar-width");
    };
  }, [collapsed]);

  return <aside className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Menu principal">
    <div className="sidebar-brand"><Link href="/"><Image className="sidebar-logo" src={collapsed ? "/assets/logo2.svg" : "/assets/logo-trackfy.svg"} width={collapsed ? 32 : 120} height={38} alt="Trackfy" /></Link><button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expandir menu" : "Minimizar menu"}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
    <nav className="sidebar-nav">
      {publicItems.map(({ href, label, icon: Icon }) => <Link className={isActive(href) ? "active" : undefined} href={href} key={href}><Icon size={19} />{label}</Link>)}
      {isAuthenticated && authenticatedItems.map(({ href, label, icon: Icon }) => <Link className={isActive(href) ? "active" : undefined} href={href} key={href}><Icon size={19} />{label}</Link>)}
    </nav>
    <nav className="sidebar-nav sidebar-nav-bottom">
      {isAuthenticated && <Link className={isActive("/configuracoes") ? "active" : undefined} href="/configuracoes"><Settings size={19} />Configurações</Link>}
      <a href="mailto:suporte@trackfy.app"><CircleHelp size={19} />Ajuda</a>
    </nav>
  </aside>;
}
