import {
  getTVEpisodeDetails,
  getTVSeasonDetails,
  getTVShowDetails,
  getWatchProviders,
  isAllowedContentDetails,
} from "./endpoints";
import { mapWatchAvailability, selectTrailer } from "./content";
import { getTMDBImageUrl } from "./image";
import type { TMDBCreditPerson } from "./types";
import type { WatchAvailability } from "@/types/media";

const POSTER_FALLBACK = "/assets/content-poster.png";
const BACKDROP_FALLBACK = "/assets/content-backdrop.png";
const PERSON_FALLBACK = "/assets/logo-mark.svg";
const EPISODE_FALLBACK = "/assets/episode-upcoming.png";

export type EpisodePageData = {
  showId: number;
  title: string;
  showTitle: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  seasonNumber: number;
  episodeNumber: number;
  voteAverage: number;
  audienceScore: number;
  trailer: { key: string; name: string } | null;
  watchAvailability: WatchAvailability | null;
  metadata: {
    director: string;
    writer: string;
    genres: string;
    originalLanguage: string;
    subtitles: string;
    certification: string;
  };
  cast: Array<{
    id: number;
    name: string;
    character: string;
    photoUrl: string;
  }>;
  seasons: Array<{ number: number; name: string }>;
  episodes: Array<{
    id: number;
    number: number;
    title: string;
    imageUrl: string;
    voteAverage: number;
    airDate: string | null;
  }>;
};

function joinCrew(
  crew: Array<{ name: string; job: string }> | undefined,
  jobs: string[],
): string {
  const names = (crew ?? [])
    .filter((person) => jobs.includes(person.job))
    .map((person) => person.name);
  return [...new Set(names)].join(", ") || "Não informado";
}

function languageName(code: string | undefined): string {
  if (!code) return "Não informado";
  try {
    const name = new Intl.DisplayNames(["pt-BR"], { type: "language" }).of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code.toUpperCase();
  }
}

function mapCast(
  seriesCast: TMDBCreditPerson[],
  guestStars: TMDBCreditPerson[],
): EpisodePageData["cast"] {
  const people = [...guestStars, ...seriesCast];
  const unique = people.filter(
    (person, index) =>
      people.findIndex((candidate) => candidate.id === person.id) === index,
  );
  return unique
    .filter((person) => person.profile_path)
    .slice(0, 6)
    .map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || "Personagem não informado",
      photoUrl:
        getTMDBImageUrl(person.profile_path, "w342") ?? PERSON_FALLBACK,
    }));
}

export async function getEpisodePageData(
  showId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<EpisodePageData | null> {
  const [show, season, episode, watchProviders] = await Promise.all([
    getTVShowDetails(showId),
    getTVSeasonDetails(showId, seasonNumber),
    getTVEpisodeDetails(showId, seasonNumber, episodeNumber),
    getWatchProviders("tv", showId).catch(() => null),
  ]);
  if (!isAllowedContentDetails(show)) return null;
  const certification =
    show.content_ratings?.results.find((rating) => rating.iso_3166_1 === "BR")
      ?.rating || "Não informada";

  return {
    showId,
    title: episode.name || `Episódio ${episodeNumber}`,
    showTitle: show.name || show.original_name || "Série",
    overview: episode.overview || "Sinopse indisponível para este episódio.",
    posterUrl: getTMDBImageUrl(show.poster_path, "w500") ?? POSTER_FALLBACK,
    backdropUrl:
      getTMDBImageUrl(show.backdrop_path, "original") ?? BACKDROP_FALLBACK,
    seasonNumber,
    episodeNumber,
    voteAverage: episode.vote_average ?? 0,
    audienceScore: episode.vote_average ?? 0,
    trailer:
      selectTrailer(episode.videos?.results) ??
      selectTrailer(show.videos?.results),
    watchAvailability: mapWatchAvailability(watchProviders?.results.BR),
    metadata: {
      director: joinCrew(episode.credits?.crew, ["Director"]),
      writer: joinCrew(episode.credits?.crew, [
        "Writer",
        "Screenplay",
        "Teleplay",
        "Story",
      ]),
      genres:
        show.genres.map((genre) => genre.name).join(", ") || "Não informado",
      originalLanguage: languageName(show.original_language),
      // O TMDB não fornece idiomas de legenda por episódio.
      subtitles: "Não informado pelo TMDB",
      certification,
    },
    cast: mapCast(
      show.credits?.cast ?? [],
      episode.credits?.guest_stars ?? [],
    ),
    seasons: show.seasons
      .filter((item) => item.season_number > 0)
      .map((item) => ({ number: item.season_number, name: item.name })),
    episodes: season.episodes.map((item) => ({
      id: item.id,
      number: item.episode_number,
      title: item.name || `Episódio ${item.episode_number}`,
      imageUrl:
        getTMDBImageUrl(item.still_path, "w780") ?? EPISODE_FALLBACK,
      voteAverage: item.vote_average ?? 0,
      airDate: item.air_date,
    })),
  };
}
