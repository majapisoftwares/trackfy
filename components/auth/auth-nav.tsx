"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, LogOut, UserRound } from "lucide-react";
import { useState } from "react";

type SessionPayload = {
  user: { id: string; email: string } | null;
};

async function fetchSession(): Promise<SessionPayload> {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
  });

  if (!response.ok) {
    return { user: null };
  }

  return response.json() as Promise<SessionPayload>;
}

export function AuthNav() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
    retry: false,
    staleTime: 60_000,
  });
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
    return <span className="nav-auth-placeholder" aria-hidden="true" />;
  }

  if (!session.data?.user) {
    return (
      <Link className="nav-link" href="/login">
        Entrar
      </Link>
    );
  }

  const initials = session.data.user.email
    .split("@", 1)[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="user-nav-menu">
      <button
        className="nav-avatar nav-auth-button"
        type="button"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label="Abrir menu do perfil"
        title={session.data.user.email}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
      >
        <span aria-hidden="true">{initials}</span>
      </button>
      {isMenuOpen && (
        <div className="user-nav-popover" role="menu">
          <Link href="/arquivados" onClick={() => setIsMenuOpen(false)} role="menuitem">
            <Archive aria-hidden="true" size={17} /> Arquivados
          </Link>
          <Link href="/perfil" onClick={() => setIsMenuOpen(false)} role="menuitem">
            <UserRound aria-hidden="true" size={17} /> Perfil
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
  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
    retry: false,
    staleTime: 60_000,
  });

  if (session.isPending || !session.data?.user) return null;

  return (
    <Link className="nav-link" href="/minha-lista">
      Minha lista
    </Link>
  );
}
