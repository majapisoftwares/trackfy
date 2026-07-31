import type { CatalogFilters } from "@/src/lib/tmdb/endpoints";
import { getMovieDetails, getTVShowDetails } from "@/src/lib/tmdb/endpoints";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { listArchivedTrackingEntries, listTrackingEntries } from "./repository";

type SavedMedia = MediaItem & {
  originalLanguage?: string;
  savedAt: string;
};

function toSavedMedia(
  entry: Awaited<ReturnType<typeof listTrackingEntries>>["items"][number],
  details: Awaited<ReturnType<typeof getMovieDetails>> | Awaited<ReturnType<typeof getTVShowDetails>>,
): SavedMedia {
  const isMovie = entry.mediaType === "movie";
  const releaseDate = isMovie
    ? (details as Awaited<ReturnType<typeof getMovieDetails>>).release_date
    : (details as Awaited<ReturnType<typeof getTVShowDetails>>).first_air_date;
  const title = isMovie
    ? (details as Awaited<ReturnType<typeof getMovieDetails>>).title
    : (details as Awaited<ReturnType<typeof getTVShowDetails>>).name;

  return {
    id: entry.mediaId,
    mediaType: entry.mediaType,
    adult: details.adult ?? false,
    title: title?.trim() || entry.title,
    overview: details.overview || "",
    posterPath: details.poster_path ?? null,
    backdropPath: details.backdrop_path ?? null,
    releaseDate: releaseDate ?? null,
    year: releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : null,
    voteAverage: details.vote_average ?? 0,
    voteCount: details.vote_count ?? 0,
    popularity: details.popularity ?? 0,
    genreIds: details.genres.map((genre) => genre.id),
    originalLanguage: details.original_language,
    savedAt: entry.updatedAt,
  };
}

function matchesFilters(item: SavedMedia, filters: CatalogFilters): boolean {
  const genreId = Number.parseInt(filters.genre ?? "", 10);
  const acceptedGenreIds = item.mediaType === "tv" && genreId === 28
    ? [28, 10759]
    : item.mediaType === "tv" && genreId === 878
      ? [878, 10765]
      : [genreId];

  return (
    (!filters.mediaType || item.mediaType === filters.mediaType) &&
    (!Number.isFinite(genreId) || acceptedGenreIds.some((id) => item.genreIds.includes(id))) &&
    (!filters.year || item.year === filters.year) &&
    (!filters.minRating || item.voteAverage >= filters.minRating) &&
    (!filters.language || item.originalLanguage === filters.language)
  );
}

function sortSavedMedia(items: SavedMedia[], sort: string | undefined): SavedMedia[] {
  return [...items].sort((left, right) => {
    if (sort === "vote_average.desc") return right.voteAverage - left.voteAverage;
    if (sort === "date.desc") return (right.releaseDate ?? "").localeCompare(left.releaseDate ?? "");
    return right.popularity - left.popularity || right.savedAt.localeCompare(left.savedAt);
  });
}

async function getTrackedMediaPage(
  tracked: Awaited<ReturnType<typeof listTrackingEntries>>,
  page: number,
  filters: CatalogFilters,
): Promise<{ page: number; results: MediaItem[]; totalPages: number }> {
  const resolved = await Promise.all(
    tracked.items.map(async (entry) => {
      try {
        const details = entry.mediaType === "movie"
          ? await getMovieDetails(entry.mediaId)
          : await getTVShowDetails(entry.mediaId);
        return toSavedMedia(entry, details);
      } catch {
        return null;
      }
    }),
  );
  const items = sortSavedMedia(
    resolved.filter((item): item is SavedMedia => item !== null).filter((item) => matchesFilters(item, filters)),
    filters.sort,
  );
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  return {
    page: currentPage,
    results: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    totalPages,
  };
}

export async function getSavedMediaPage(
  ownerId: string,
  page: number,
  filters: CatalogFilters,
): Promise<{ page: number; results: MediaItem[]; totalPages: number }> {
  const tracked = await listTrackingEntries(ownerId, {
    inList: true,
    limit: 1_000,
    offset: 0,
  });
  return getTrackedMediaPage(tracked, page, filters);
}

export async function getArchivedMediaPage(
  ownerId: string,
  page: number,
  filters: CatalogFilters,
): Promise<{ page: number; results: MediaItem[]; totalPages: number }> {
  const tracked = await listArchivedTrackingEntries(ownerId, {
    limit: 1_000,
    offset: 0,
  });
  return getTrackedMediaPage(tracked, page, filters);
}
