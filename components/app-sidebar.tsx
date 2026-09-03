"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Flame,
  History,
  House,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Tv,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SessionPayload, useAuthSession } from "@/src/lib/auth/client";
import { getUserRank } from "@/src/lib/ranking";

const navItems = [
  { href: "/", label: "Início", icon: House },
  { href: "/pesquisar", label: "Pesquisar", icon: Search },
  { href: "/populares", label: "Populares", icon: Flame },
  { href: "/minha-lista", label: "Minha lista", icon: Bookmark },
];

export function AppSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthSession();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = Boolean(session.data?.user);
  const user = session.data?.user;
  const rank = user?.rank ?? getUserRank(0);

  const displayName = user?.nickname || user?.email || "";
  const initials = displayName
    ? displayName.split("@", 1)[0].slice(0, 2).toUpperCase()
    : "";

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("LOGOUT_FAILED");
    },
    onSuccess: () => {
      queryClient.setQueryData<SessionPayload>(["auth-session"], {
        user: null,
      });
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
      setIsUserMenuOpen(false);
      setIsMobileSheetOpen(false);
      router.refresh();
    },
  });

  // Desktop sidebar width offset variable
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--dashboard-sidebar-offset",
      isExpanded ? "252px" : "96px"
    );
    return () => {
      document.documentElement.style.removeProperty("--dashboard-sidebar-offset");
    };
  }, [isExpanded]);

  // Click outside listener for desktop user popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Close menus on page navigation
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileSheetOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobileSheetOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileSheetOpen]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const isPopularActive =
    pathname === "/populares" ||
    pathname.startsWith("/populares/") ||
    pathname.startsWith("/filmes/populares") ||
    pathname.startsWith("/series/populares") ||
    pathname.startsWith("/animes/populares");

  const isProfileTabActive =
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/") ||
    pathname === "/configuracoes" ||
    pathname.startsWith("/configuracoes/") ||
    pathname === "/arquivados" ||
    pathname.startsWith("/arquivados/") ||
    pathname === "/episodios-para-assistir" ||
    pathname.startsWith("/episodios-para-assistir/");

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* DESKTOP SIDEBAR (Visible >= 901px)                  */}
      {/* ---------------------------------------------------- */}
      <aside
        className={`app-sidebar floating-sidebar ${isExpanded ? "is-expanded" : "is-collapsed"}`}
        aria-label="Menu lateral"
      >
        {/* Top: Logo & Toggle */}
        <div className="sidebar-top">
          <Link href="/" className="sidebar-logo-link" title="Trackfy — Início">
            {isExpanded ? (
              <Image
                className="sidebar-logo-full"
                src="/assets/logo-trackfy.svg"
                width={112}
                height={28}
                alt="Trackfy"
                priority
              />
            ) : (
              <Image
                className="sidebar-logo-icon"
                src="/assets/logo-mark.svg"
                width={26}
                height={30}
                alt="Trackfy"
                priority
              />
            )}
          </Link>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
            title={isExpanded ? "Recolher menu" : "Expandir menu"}
          >
            {isExpanded ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
        </div>

        {/* Center: Main navigation icons and labels */}
        <nav className="sidebar-nav">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item ${isActive(href) ? "active" : ""}`}
              title={label}
              aria-label={label}
            >
              <span className="sidebar-nav-icon">
                <Icon size={20} />
              </span>
              {isExpanded && <span className="sidebar-nav-label">{label}</span>}
            </Link>
          ))}

        </nav>

        {/* Bottom: Settings, Divider & User Avatar */}
        <div className="sidebar-bottom">
          <Link
            href="/configuracoes"
            className={`sidebar-nav-item ${isActive("/configuracoes") ? "active" : ""}`}
            title="Configurações"
            aria-label="Configurações"
          >
            <span className="sidebar-nav-icon">
              <Settings size={20} />
            </span>
            {isExpanded && <span className="sidebar-nav-label">Configurações</span>}
          </Link>

          <div className="sidebar-divider" aria-hidden="true" />

          {/* User profile / avatar */}
          {isAuthenticated ? (
            <div className="sidebar-user-wrapper" ref={userMenuRef}>
              <button
                type="button"
                className={`sidebar-user-trigger ${isExpanded ? "is-expanded" : ""}`}
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                title={displayName}
              >
                <span className="sidebar-user-avatar">{initials}</span>
                {isExpanded && (
                  <div className="sidebar-user-info">
                    <strong className="sidebar-user-name">{displayName}</strong>
                    <span className={`sidebar-user-role rank-tone-${rank.tone}`}>
                      <i aria-hidden="true" />
                      {rank.name}
                    </span>
                  </div>
                )}
                {isExpanded && <ChevronRight size={15} className="sidebar-user-chevron" />}
              </button>

              {isUserMenuOpen && (
                <div className={`sidebar-user-popover ${isExpanded ? "popover-expanded" : ""}`} role="menu">
                  <div className="sidebar-popover-header">
                    <small>Conectado como</small>
                    <strong>{displayName}</strong>
                  </div>
                  <div className="sidebar-popover-divider" />
                  <Link
                    href="/perfil"
                    className="sidebar-popover-item"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserRound size={16} /> Perfil
                  </Link>
                  <Link
                    href="/arquivados"
                    className="sidebar-popover-item"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <History size={16} /> Histórico
                  </Link>
                  <Link
                    href="/configuracoes"
                    className="sidebar-popover-item"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings size={16} /> Configurações
                  </Link>
                  <div className="sidebar-popover-divider" />
                  <button
                    type="button"
                    className="sidebar-popover-item sidebar-logout-btn"
                    role="menuitem"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                  >
                    <LogOut size={16} />
                    {logout.isPending ? "Saindo..." : "Sair"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`sidebar-user-trigger sidebar-guest-trigger ${isExpanded ? "is-expanded" : ""}`}
              title="Entrar"
              aria-label="Entrar"
            >
              <span className="sidebar-user-avatar guest-avatar">
                <UserRound size={18} />
              </span>
              {isExpanded && (
                <div className="sidebar-user-info">
                  <strong className="sidebar-user-name">Entrar</strong>
                  <span className="sidebar-user-role">Fazer login</span>
                </div>
              )}
            </Link>
          )}
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* MOBILE FIXED BOTTOM MENU (Visible <= 900px)         */}
      {/* ---------------------------------------------------- */}
      <nav className="app-sidebar-mobile" aria-label="Navegação móvel principal">
        {/* Tab 1: Início */}
        <Link
          href="/"
          className={`mobile-tab-btn ${isActive("/") ? "active" : ""}`}
          aria-current={isActive("/") ? "page" : undefined}
          title="Início"
          aria-label="Início"
        >
          <span className="mobile-tab-icon-wrap">
            <House size={21} strokeWidth={2} />
          </span>
        </Link>

        {/* Tab 2: Pesquisar */}
        <Link
          href="/pesquisar"
          className={`mobile-tab-btn ${isActive("/pesquisar") ? "active" : ""}`}
          aria-current={isActive("/pesquisar") ? "page" : undefined}
          title="Pesquisar"
          aria-label="Pesquisar"
        >
          <span className="mobile-tab-icon-wrap">
            <Search size={21} strokeWidth={2} />
          </span>
        </Link>

        {/* Tab 3: Populares */}
        <Link
          href="/populares"
          className={`mobile-tab-btn ${isPopularActive ? "active" : ""}`}
          aria-current={isPopularActive ? "page" : undefined}
          title="Populares"
          aria-label="Populares"
        >
          <span className="mobile-tab-icon-wrap">
            <Flame size={21} strokeWidth={2} />
          </span>
        </Link>

        {/* Tab 4: Minha Lista */}
        <Link
          href="/minha-lista"
          className={`mobile-tab-btn ${isActive("/minha-lista") ? "active" : ""}`}
          aria-current={isActive("/minha-lista") ? "page" : undefined}
          title="Minha lista"
          aria-label="Minha lista"
        >
          <span className="mobile-tab-icon-wrap">
            <Bookmark size={21} strokeWidth={2} />
          </span>
        </Link>

        {/* Tab 5: Perfil / Menu (Abre Bottom Sheet com Menu de opções) */}
        <button
          type="button"
          className={`mobile-tab-btn ${isProfileTabActive || isMobileSheetOpen ? "active" : ""}`}
          onClick={() => setIsMobileSheetOpen((open) => !open)}
          aria-expanded={isMobileSheetOpen}
          aria-haspopup="dialog"
          aria-label={isAuthenticated ? "Menu da conta" : "Menu de acesso"}
          title={isAuthenticated ? displayName : "Entrar / Menu"}
        >
          <span className="mobile-tab-icon-wrap">
            {isAuthenticated ? (
              <span className="mobile-tab-avatar">{initials}</span>
            ) : (
              <UserRound size={21} strokeWidth={2} />
            )}
          </span>
        </button>
      </nav>

      {/* ---------------------------------------------------- */}
      {/* MOBILE BOTTOM SHEET (Menu de opções da conta)       */}
      {/* ---------------------------------------------------- */}
      {isMobileSheetOpen && (
        <div className="mobile-sheet-portal" role="dialog" aria-modal="true" aria-label="Menu de opções">
          {/* Backdrop */}
          <div
            className="mobile-sheet-backdrop"
            onClick={() => setIsMobileSheetOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet container */}
          <div className="mobile-sheet-panel">
            {/* Top drag handle indicator */}
            <div className="mobile-sheet-handle" aria-hidden="true" />

            {/* Header info */}
            <div className="mobile-sheet-header">
              <div className="mobile-sheet-user-row">
                <div className="mobile-sheet-avatar">
                  {isAuthenticated ? initials : <UserRound size={20} />}
                </div>
                <div className="mobile-sheet-user-info">
                  <strong className="mobile-sheet-user-name">
                    {isAuthenticated ? displayName : "Trackfy"}
                  </strong>
                  <span className={`mobile-sheet-user-sub ${isAuthenticated ? `rank-tone-${rank.tone}` : ""}`}>
                    {isAuthenticated ? <><i aria-hidden="true" /> {rank.name}</> : "Faça login para salvar seus favoritos"}
                  </span>
                </div>
                <button
                  type="button"
                  className="mobile-sheet-close-btn"
                  onClick={() => setIsMobileSheetOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Links list */}
            <div className="mobile-sheet-body">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/perfil"
                    className={`mobile-sheet-item ${isActive("/perfil") ? "active" : ""}`}
                    onClick={() => setIsMobileSheetOpen(false)}
                  >
                    <span className="mobile-sheet-item-icon">
                      <UserRound size={18} />
                    </span>
                    <span className="mobile-sheet-item-text">Meu Perfil</span>
                    <ChevronRight size={16} className="mobile-sheet-chevron" />
                  </Link>

                  <Link
                    href="/episodios-para-assistir"
                    className={`mobile-sheet-item ${isActive("/episodios-para-assistir") ? "active" : ""}`}
                    onClick={() => setIsMobileSheetOpen(false)}
                  >
                    <span className="mobile-sheet-item-icon">
                      <CalendarDays size={18} />
                    </span>
                    <span className="mobile-sheet-item-text">Calendário de Episódios</span>
                    <ChevronRight size={16} className="mobile-sheet-chevron" />
                  </Link>

                  <Link
                    href="/arquivados"
                    className={`mobile-sheet-item ${isActive("/arquivados") ? "active" : ""}`}
                    onClick={() => setIsMobileSheetOpen(false)}
                  >
                    <span className="mobile-sheet-item-icon">
                      <History size={18} />
                    </span>
                    <span className="mobile-sheet-item-text">Histórico</span>
                    <ChevronRight size={16} className="mobile-sheet-chevron" />
                  </Link>

                  <Link
                    href="/configuracoes"
                    className={`mobile-sheet-item ${isActive("/configuracoes") ? "active" : ""}`}
                    onClick={() => setIsMobileSheetOpen(false)}
                  >
                    <span className="mobile-sheet-item-icon">
                      <Settings size={18} />
                    </span>
                    <span className="mobile-sheet-item-text">Configurações</span>
                    <ChevronRight size={16} className="mobile-sheet-chevron" />
                  </Link>

                  <div className="mobile-sheet-divider" />

                  <button
                    type="button"
                    className="mobile-sheet-item mobile-sheet-logout"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                  >
                    <span className="mobile-sheet-item-icon">
                      <LogOut size={18} />
                    </span>
                    <span className="mobile-sheet-item-text">
                      {logout.isPending ? "Saindo..." : "Sair da conta"}
                    </span>
                  </button>
                </>
              ) : (
                <div className="mobile-sheet-guest-actions">
                  <Link
                    href="/login"
                    className="mobile-sheet-btn-primary"
                    onClick={() => setIsMobileSheetOpen(false)}
                  >
                    Entrar na conta
                  </Link>
                  <Link
                    href="/cadastro"
                    className="mobile-sheet-btn-secondary"
                    onClick={() => setIsMobileSheetOpen(false)}
                  >
                    Criar nova conta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
