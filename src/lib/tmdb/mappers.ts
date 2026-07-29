import type {
  MediaItem,
  TMDBMediaResult,
  TMDBMovie,
  TMDBTVShow,
} from "./types";

function getYear(date: string | undefined): number | null {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

export function mapMovie(movie: TMDBMovie): MediaItem {
  const releaseDate = movie.release_date || null;
  return {
    id: movie.id,
    mediaType: "movie",
    adult: movie.adult ?? false,
    title: movie.title?.trim() || movie.original_title?.trim() || "Título indisponível",
    originalTitle: movie.original_title || undefined,
    overview: movie.overview || "",
    posterPath: movie.poster_path || null,
    backdropPath: movie.backdrop_path || null,
    releaseDate,
    year: getYear(movie.release_date),
    voteAverage: movie.vote_average ?? 0,
    voteCount: movie.vote_count ?? 0,
    popularity: movie.popularity ?? 0,
    genreIds: movie.genre_ids ?? [],
  };
}

export function mapTVShow(show: TMDBTVShow): MediaItem {
  const releaseDate = show.first_air_date || null;
  return {
    id: show.id,
    mediaType: "tv",
    adult: show.adult ?? false,
    title: show.name?.trim() || show.original_name?.trim() || "Título indisponível",
    originalTitle: show.original_name || undefined,
    overview: show.overview || "",
    posterPath: show.poster_path || null,
    backdropPath: show.backdrop_path || null,
    releaseDate,
    year: getYear(show.first_air_date),
    voteAverage: show.vote_average ?? 0,
    voteCount: show.vote_count ?? 0,
    popularity: show.popularity ?? 0,
    genreIds: show.genre_ids ?? [],
  };
}

export function mapMediaResult(result: TMDBMediaResult): MediaItem {
  if (result.media_type === "tv" || "name" in result) {
    return mapTVShow(result as TMDBTVShow);
  }
  return mapMovie(result as TMDBMovie);
}
