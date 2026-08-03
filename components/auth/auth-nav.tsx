"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, List, LogIn, LogOut, Settings, UserRound } from "lucide-react";
import { useState } from "react";
import { type SessionPayload, useAuthSession } from "@/src/lib/auth/client";

export function AuthNav({ drawer = false }: { drawer?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const session = useAuthSession();
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
      router.refresh();
    },
  });

  if (session.isPending) {
    if (drawer) return null;
    return <span className="nav-auth-placeholder" aria-hidden="true" />;
  }

  if (!session.data?.user) {
    if (drawer) {
      return (
        <Link className="nav-link drawer-login-link" href="/login">
          <LogIn aria-hidden="true" className="drawer-nav-icon" size={18} />
          Entrar
        </Link>
      );
    }
    return (
      <Link className="nav-link" href="/login">
        <LogIn aria-hidden="true" className="drawer-nav-icon" size={18} />
        Entrar
      </Link>
    );
  }

  const displayName = session.data.user.nickname || session.data.user.email;
  const initials = displayName
    .split("@", 1)[0]
    .slice(0, 2)
    .toUpperCase();

  if (drawer) {
    return (
      <div className="drawer-auth">
        <button
          className="drawer-profile-button"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="drawer-profile-options"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <UserRound aria-hidden="true" className="drawer-nav-icon" size={18} />
          Conta
          <ChevronDown aria-hidden="true" size={18} className={isMenuOpen ? "is-open" : ""} />
        </button>
        {isMenuOpen && (
          <div className="drawer-profile-options" id="drawer-profile-options">
            <Link href="/perfil" onClick={() => setIsMenuOpen(false)}><UserRound aria-hidden="true" size={18} /> Perfil</Link>
            <Link href="/configuracoes" onClick={() => setIsMenuOpen(false)}><Settings aria-hidden="true" size={18} /> Configurações</Link>
            <Link href="/arquivados" onClick={() => setIsMenuOpen(false)}><Archive aria-hidden="true" size={18} /> Arquivados</Link>
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut aria-hidden="true" size={18} />
              {logout.isPending ? "Saindo..." : "Sair"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="user-nav-menu">
      <button
        className="nav-user-trigger nav-auth-button"
        type="button"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label="Abrir menu do perfil"
        title={displayName}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
      >
        <span className="nav-avatar" aria-hidden="true">{initials}</span>
        <ChevronDown aria-hidden="true" className="nav-avatar-chevron" size={18} />
      </button>
      {isMenuOpen && (
        <div className="user-nav-popover" role="menu">
          <Link href="/arquivados" onClick={() => setIsMenuOpen(false)} role="menuitem">
            <Archive aria-hidden="true" size={17} /> Arquivados
          </Link>
          <Link href="/perfil" onClick={() => setIsMenuOpen(false)} role="menuitem">
            <UserRound aria-hidden="true" size={17} /> Perfil
          </Link>
          <Link href="/configuracoes" onClick={() => setIsMenuOpen(false)} role="menuitem">
            <Settings aria-hidden="true" size={17} /> Configurações
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut aria-hidden="true" size={17} />
            {logout.isPending ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}

export function MyListNav() {
  const session = useAuthSession();

  if (session.isPending || !session.data?.user) return null;

  return (
    <Link className="nav-link nav-my-list" href="/minha-lista">
      <List aria-hidden="true" className="drawer-nav-icon" size={18} />
      Minha lista
    </Link>
  );
}
