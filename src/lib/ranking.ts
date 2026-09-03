const USER_RANKS = [
  { name: "Espectador", tone: "slate", minimumPoints: 0 },
  { name: "Maratonista", tone: "sky", minimumPoints: 25 },
  { name: "Cinéfilo", tone: "violet", minimumPoints: 75 },
  { name: "Colecionador", tone: "amber", minimumPoints: 150 },
  { name: "Curador", tone: "orange", minimumPoints: 300 },
  { name: "Especialista", tone: "emerald", minimumPoints: 600 },
  { name: "Arquivista", tone: "cyan", minimumPoints: 1000 },
  { name: "Lenda", tone: "indigo", minimumPoints: 2000 },
] as const;

export type UserRank = Pick<(typeof USER_RANKS)[number], "name" | "tone">;

/** Retorna o badge correspondente à pontuação interna do usuário. */
export function getUserRank(points: number): UserRank {
  const normalizedPoints = Number.isFinite(points)
    ? Math.max(0, Math.floor(points))
    : 0;

  const rank = [...USER_RANKS]
    .reverse()
    .find((rank) => normalizedPoints >= rank.minimumPoints) ?? USER_RANKS[0];

  return { name: rank.name, tone: rank.tone };
}
