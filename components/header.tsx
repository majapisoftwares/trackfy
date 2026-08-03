"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { AuthNav, MyListNav } from "./auth/auth-nav";
import { SearchInput } from "./search-input";

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header
      className={`site-header container ${isMobileSearchOpen ? "is-mobile-search-open" : ""}`}
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
      <nav
        className={`header-nav ${isMobileMenuOpen ? "is-open" : ""}`}
        id="main-navigation"
        aria-label="Navegação principal"
      >
        {pathname !== "/" && (
          <Link className="nav-link" href="/">
            <Home aria-hidden="true" className="drawer-nav-icon" size={18} />
            Início
          </Link>
        )}
        <AuthNav drawer />
        <MyListNav />
        <Link className="nav-link nav-popular" href="/populares">
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
