import { rawgFetch } from "./client";
import type { GameDetails, GameFilters, GameItem, GamePage, RawgNamedItem } from "./types";

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released?: string | null;
  background_image?: string | null;
  rating?: number | null;
  ratings_count?: number;
  metacritic?: number | null;
  genres?: RawgNamedItem[];
  platforms?: Array<{ platform?: RawgNamedItem }>;
  description_raw?: string | null;
  developers?: RawgNamedItem[];
  publishers?: RawgNamedItem[];
  website?: string | null;
};

type RawgPage = { count: number; results: RawgGame[] };

function safeImage(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function mapGame(game: RawgGame): GameItem {
  return {
    id: game.id,
    slug: game.slug,
    name: game.name,
    released: game.released ?? null,
    backgroundImage: safeImage(game.background_image),
    rating: typeof game.rating === "number" ? game.rating : null,
    ratingsCount: game.ratings_count ?? 0,
    metacritic: typeof game.metacritic === "number" ? game.metacritic : null,
    genres: game.genres ?? [],
    platforms: (game.platforms ?? []).flatMap((item) => item.platform ? [item.platform] : []),
  };
}

export async function getGamesPage(filters: GameFilters = {}): Promise<GamePage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(40, Math.max(1, filters.pageSize ?? 20));
  const data = await rawgFetch<RawgPage>("/games", { ...filters, page, page_size: pageSize });
  return { page, pageSize, count: data.count, results: data.results.map(mapGame) };
}

export async function getGameItem(slug: string): Promise<GameItem> {
  const game = await rawgFetch<RawgGame>(`/games/${encodeURIComponent(slug)}`, {}, 60 * 60 * 6);
  return mapGame(game);
}

export async function getGameDetails(slug: string): Promise<GameDetails> {
  const game = await rawgFetch<RawgGame>(`/games/${encodeURIComponent(slug)}`, {}, 60 * 60 * 6);
  const screenshots = await rawgFetch<{ results: Array<{ image?: string | null }> }>(
    `/games/${encodeURIComponent(slug)}/screenshots`,
    {},
    60 * 60 * 6,
  ).catch(() => ({ results: [] }));
  return {
    ...mapGame(game),
    description: game.description_raw?.trim() || null,
    developers: game.developers ?? [],
    publishers: game.publishers ?? [],
    website: safeImage(game.website),
    screenshots: screenshots.results.map((item) => safeImage(item.image)).filter((item): item is string => Boolean(item)),
  };
}

export async function getGameGenres(): Promise<RawgNamedItem[]> {
  const data = await rawgFetch<{ results: RawgNamedItem[] }>("/genres", {}, 60 * 60 * 24);
  return data.results;
}
