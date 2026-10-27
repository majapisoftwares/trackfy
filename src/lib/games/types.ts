export const GAME_STATUSES = ["wishlist", "playing", "completed", "paused", "dropped"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export type UserGame = {
  gameId: number;
  slug: string;
  name: string;
  coverUrl: string | null;
  status: GameStatus;
  personalRating: number | null;
  platform: string | null;
  hoursPlayed: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserGamePatch = {
  slug?: string;
  name?: string;
  coverUrl?: string | null;
  status?: GameStatus;
  personalRating?: number | null;
  platform?: string | null;
  hoursPlayed?: number | null;
  completedAt?: string | null;
};

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  wishlist: "Quero jogar",
  playing: "Jogando",
  completed: "Finalizado",
  paused: "Pausado",
  dropped: "Abandonado",
};
