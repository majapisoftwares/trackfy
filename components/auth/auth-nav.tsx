"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  return (
    <button
      className="nav-avatar nav-auth-button"
      type="button"
      title={`Sair de ${session.data.user.email}`}
      aria-label={`Sair de ${session.data.user.email}`}
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      <Image
        src="/assets/logo-mark.svg"
        alt=""
        width={26}
        height={30}
        priority
      />
      {logout.isPending && <span className="sr-only">Saindo...</span>}
    </button>
  );
}

export function MyListNav() {
  return (
    <Link className="nav-link" href="/minha-lista">
      Minha lista
    </Link>
  );
}

export function ArchivedNav() {
  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
    retry: false,
    staleTime: 60_000,
  });

  if (session.isPending || !session.data?.user) return null;

  return (
    <Link className="nav-link" href="/arquivados">
      Arquivados
    </Link>
  );
}
