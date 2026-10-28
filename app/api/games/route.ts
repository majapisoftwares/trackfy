import type { NextRequest } from "next/server";
import { getGamesPage } from "@/src/lib/rawg/endpoints";
import { RawgError } from "@/src/lib/rawg/client";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";

const ORDERING = new Set(["-added", "-rating", "released", "-released"]);
const bounded = (value: string | null, fallback: number, maximum: number) => {
  if (!value) return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= maximum ? number : null;
};
const clean = (value: string | null, maximum: number) => value && value.trim().length <= maximum ? value.trim() : undefined;
const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function isStrictMatch(name: string, query: string) {
  const normalizedName = searchable(name);
  const terms = searchable(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  return terms.every((term) => normalizedName.includes(term));
}

export async function GET(request: NextRequest) {
  const page = bounded(request.nextUrl.searchParams.get("page"), 1, 10_000);
  const pageSize = bounded(request.nextUrl.searchParams.get("pageSize"), 20, 40);
  const ordering = request.nextUrl.searchParams.get("ordering") ?? "-added";
  const search = clean(request.nextUrl.searchParams.get("search"), 100);
  const genres = clean(request.nextUrl.searchParams.get("genres"), 150);
  const platforms = clean(request.nextUrl.searchParams.get("platforms"), 150);
  const dates = clean(request.nextUrl.searchParams.get("dates"), 25);
  const metacritic = clean(request.nextUrl.searchParams.get("metacritic"), 10);
  const strictSearch = request.nextUrl.searchParams.get("strictSearch") === "1";
  if (page === null || pageSize === null || !ORDERING.has(ordering)) {
    return apiError("INVALID_QUERY", "Os filtros de jogos são inválidos.", 400);
  }
  try {
    const data = await getGamesPage({ page, pageSize, ordering: ordering as "-added", search, genres, platforms, dates, metacritic });
    if (!strictSearch || !search) return jsonNoStore(data);
    const results = data.results.filter((game) => isStrictMatch(game.name, search));
    return jsonNoStore({ ...data, results, count: results.length < pageSize ? (page - 1) * pageSize + results.length : data.count });
  } catch (error) {
    logger.error(error, "RAWG_GAMES_ERROR");
    return apiError("GAMES_UNAVAILABLE", error instanceof RawgError ? error.message : "Não foi possível carregar os jogos.", 503);
  }
}
