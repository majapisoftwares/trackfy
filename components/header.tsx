"use client";

import Image from "next/image";
import Link from "next/link";
import { BookCheck, CalendarDays, Flame, History, Home, Menu, Settings, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useAuthSession } from "@/src/lib/auth/client";
import { AuthNav } from "./auth/auth-nav";
import { SearchInput } from "./search-input";

function AuthenticatedDrawerLinks({ onNavigate }: { onNavigate: () => void }) {
  const session = useAuthSession();

  if (!session.data?.user) return null;

  return (
    <>
      <Link className="nav-link drawer-sidebar-link" href="/episodios-para-assistir" onClick={onNavigate}>
        <CalendarDays aria-hidden="true" className="drawer-nav-icon" size={18} />
        Calendário
      </Link>
      <Link className="nav-link drawer-sidebar-link" href="/minha-lista" onClick={onNavigate}>
        <BookCheck aria-hidden="true" className="drawer-nav-icon" size={18} />
        Minha lista
      </Link>
      <Link className="nav-link drawer-sidebar-link" href="/arquivados" onClick={onNavigate}>
        <History aria-hidden="true" className="drawer-nav-icon" size={18} />
        Histórico
      </Link>
      <Link className="nav-link drawer-sidebar-link" href="/perfil" onClick={onNavigate}>
        <UserRound aria-hidden="true" className="drawer-nav-icon" size={18} />
        Perfil
      </Link>
      <Link className="nav-link drawer-sidebar-link" href="/configuracoes" onClick={onNavigate}>
        <Settings aria-hidden="true" className="drawer-nav-icon" size={18} />
        Configurações
      </Link>
    </>
  );
}

export function Header({ dashboard = false }: { dashboard?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header
      className={`site-header container ${dashboard ? "dashboard-header" : "default-header"} ${isMobileSearchOpen ? "is-mobile-search-open" : ""}`}
    >
      <Link href="/" aria-label="Trackfy — início">
        <Image
          className="logo-mark"
          src="/assets/logo-mark.svg"
          width={50}
          height={58}
          alt=""
          priority
        />
      </Link>
      <SearchInput
        compact
        onCompactOpenChange={(isOpen) => {
          setIsMobileSearchOpen(isOpen);
          if (isOpen) setIsMobileMenuOpen(false);
        }}
      />
      <button
        aria-controls="main-navigation"
        aria-expanded={isMobileMenuOpen}
        aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        className="mobile-menu-button"
        onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        type="button"
      >
        {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      {isMobileMenuOpen && (
        <button
          aria-label="Fechar menu"
          className="mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          type="button"
        />
      )}
      <nav
        className={`header-nav ${isMobileMenuOpen ? "is-open" : ""}`}
        id="main-navigation"
        aria-label="Navegação principal"
      >
        <button
          aria-label="Fechar menu"
          className="drawer-close-button"
          onClick={() => setIsMobileMenuOpen(false)}
          type="button"
        >
          <X aria-hidden="true" size={22} />
        </button>
        <Link className="nav-link drawer-home-link" href="/" onClick={() => setIsMobileMenuOpen(false)}>
          <Home aria-hidden="true" className="drawer-nav-icon" size={18} />
          Início
        </Link>
        <AuthenticatedDrawerLinks onNavigate={() => setIsMobileMenuOpen(false)} />
        <AuthNav drawer />
        <Link className="nav-link nav-popular" href="/populares" onClick={() => setIsMobileMenuOpen(false)}>
          <Flame aria-hidden="true" className="drawer-nav-icon" size={18} />
          Populares
        </Link>
      </nav>
      <div className="header-desktop-auth">
        <AuthNav />
      </div>
    </header>
  );
}
