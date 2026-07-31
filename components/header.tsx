"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArchivedNav, AuthNav, MyListNav } from "./auth/auth-nav";
import { SearchInput } from "./search-input";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header container">
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
      <nav className="header-nav" aria-label="Navegação principal">
        {pathname !== "/" && (
          <Link className="nav-link" href="/">
            Início
          </Link>
        )}
        <MyListNav />
        <ArchivedNav />
        <Link className="nav-link" href="/populares">
          Populares
        </Link>
        <SearchInput />
        <AuthNav />
      </nav>
    </header>
  );
}
