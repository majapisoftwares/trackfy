"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserRank } from "@/src/lib/ranking";

export type SessionPayload = {
  user: {
    id: string;
    email: string;
    nickname: string | null;
    rank: UserRank;
  } | null;
};

async function fetchSession(): Promise<SessionPayload> {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
  });

  if (!response.ok) return { user: null };

  return response.json() as Promise<SessionPayload>;
}

export function useAuthSession() {
  return useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
    retry: false,
    staleTime: 60_000,
  });
}
