import type { MediaItem, PaginatedMedia } from "@/src/lib/tmdb/types";
import { jikanFetch } from "./client";

type JikanTopAnime = {
  mal_id: number;
  title: string;
  title_japanese?: string | null;
  synopsis?: string | null;
  images?: { jpg?: { large_image_url?: string | null; image_url?: string | null } };
  aired?: { from?: string | null };
  score?: number | null;
  scored_by?: number | null;
  members?: number | null;
  genres?: Array<{ mal_id: number }>;
  url: string;
  rank?: number | null;
};

type JikanTopAnimeResponse = {
  data: JikanTopAnime[];
  pagination: {
    current_page: number;
    last_visible_page: number;
    items: { total: number };
  };
};

function getYear(date: string | null | undefined): number | null {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function mapAnime(anime: JikanTopAnime): MediaItem {
  return {
    id: anime.mal_id,
    // The shared card still treats an anime as serial content. Its source
    // prevents it from being sent to TMDB detail/tracking flows.
    mediaType: "tv",
    source: "jikan",
    externalUrl: anime.url,
    posterUrl: anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url ?? null,
    adult: false,
    title: anime.title,
    originalTitle: anime.title_japanese ?? undefined,
    overview: anime.synopsis ?? "",
    posterPath: null,
    backdropPath: null,
    releaseDate: anime.aired?.from ?? null,
    year: getYear(anime.aired?.from),
    voteAverage: anime.score ?? 0,
    voteCount: anime.scored_by ?? 0,
    popularity: anime.members ?? 0,
    genreIds: anime.genres?.map((genre) => genre.mal_id) ?? [],
    rankingPosition: anime.rank ?? undefined,
  };
}

export async function getPopularAnimePage(page = 1): Promise<PaginatedMedia> {
  const response = await jikanFetch<JikanTopAnimeResponse>("/top/anime", {
    page,
    limit: 20,
    sfw: "true",
  });

  return {
    page: response.pagination.current_page,
    results: response.data.map(mapAnime),
    totalPages: response.pagination.last_visible_page,
    totalResults: response.pagination.items.total,
  };
}
