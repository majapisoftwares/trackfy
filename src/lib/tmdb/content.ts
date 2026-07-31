import type {
  ContentDetails,
  Episode,
  WatchAvailability,
} from "@/types/media";
import {
  getMovieDetails,
  getRecommendations,
  getTVSeasonDetails,
  getTVShowDetails,
  getWatchProviders,
  isAllowedContentDetails,
} from "./endpoints";
import { getTMDBImageUrl } from "./image";
import type {
  MediaItem,
  MediaType,
  TMDBAggregateCredits,
  TMDBCredits,
  TMDBEpisode,
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBVideo,
  TMDBWatchProviderRegion,
} from "./types";

const POSTER_FALLBACK = "/assets/content-poster.png";
const BACKDROP_FALLBACK = "/assets/content-backdrop.png";
const PERSON_FALLBACK = "/assets/logo-mark.svg";
const EPISODE_FALLBACK = "/assets/episode-upcoming.png";

function translateStatus(status: string): string {
  const statuses: Record<string, string> = {
    "Returning Series": "Em andamento",
    Ended: "Finalizada",
    Released: "Lançado",
    "In Production": "Em produção",
    Planned: "Planejado",
    Canceled: "Cancelado",
  };
  return statuses[status] ?? (status || "Status indisponível");
}

function formatDate(date: string | undefined): string {
  if (!date) return "Data indisponível";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatRuntime(runtime: number | null): string {
  if (!runtime || runtime < 1) return "Não informada";

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function selectCertification(
  details: TMDBMovieDetails | TMDBTVShowDetails,
): string {
  if ("release_dates" in details) {
    const regions = details.release_dates?.results ?? [];
    for (const country of ["BR", "US"]) {
      const certification = regions
        .find((region) => region.iso_3166_1 === country)
        ?.release_dates.find((release) => release.certification.trim())
        ?.certification.trim();
      if (certification) return certification;
    }
  }

  if ("content_ratings" in details) {
    const ratings = details.content_ratings?.results ?? [];
    for (const country of ["BR", "US"]) {
      const certification = ratings
        .find((rating) => rating.iso_3166_1 === country)
        ?.rating.trim();
      if (certification) return certification;
    }
  }

  return "Não informada";
}

function mapCast(credits: TMDBCredits | undefined): ContentDetails["cast"] {
  return (credits?.cast ?? [])
    .filter((person) => person.profile_path)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .slice(0, 12)
    .map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || "Personagem não informado",
      photoUrl:
        getTMDBImageUrl(person.profile_path, "w342") ?? PERSON_FALLBACK,
    }));
}

function mapAggregateCast(
  credits: TMDBAggregateCredits | undefined,
): ContentDetails["cast"] {
  return (credits?.cast ?? [])
    .filter((person) => person.profile_path)
    .sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) ||
        b.total_episode_count - a.total_episode_count,
    )
    .slice(0, 12)
    .map((person) => {
      const primaryRole = [...person.roles].sort(
        (a, b) => b.episode_count - a.episode_count,
      )[0];

      return {
        id: person.id,
        name: person.name,
        character: primaryRole?.character || "Personagem não informado",
        episodeCount: person.total_episode_count,
        photoUrl:
          getTMDBImageUrl(person.profile_path, "w342") ?? PERSON_FALLBACK,
      };
    });
}

function mapEpisode(
  episode: TMDBEpisode,
  fallbackImageUrl = EPISODE_FALLBACK,
): Episode {
  return {
    id: episode.id,
    number: episode.episode_number,
    title: episode.name || `Episódio ${episode.episode_number}`,
    imageUrl:
      getTMDBImageUrl(episode.still_path, "w780") ?? fallbackImageUrl,
    rating: episode.vote_average > 0 ? episode.vote_average : undefined,
    releaseLabel: episode.air_date
      ? formatDate(episode.air_date)
      : "Data não informada",
  };
}

export function mapWatchAvailability(
  region: TMDBWatchProviderRegion | undefined,
): WatchAvailability | null {
  if (!region?.link || !region.flatrate?.length) return null;

  return {
    link: region.link,
    label: "Disponível por assinatura",
    providers: [...region.flatrate]
      .sort((a, b) => a.display_priority - b.display_priority)
      .map((provider) => ({
        id: provider.provider_id,
        name: provider.provider_name,
        logoUrl:
          getTMDBImageUrl(provider.logo_path, "w342") ?? PERSON_FALLBACK,
      })),
  };
}

export function selectTrailer(videos: TMDBVideo[] | undefined) {
  const youtubeVideos = (videos ?? []).filter(
    (video) =>
      video.site === "YouTube" &&
      (video.type === "Trailer" || video.type === "Teaser") &&
      /^[A-Za-z0-9_-]{6,20}$/.test(video.key),
  );

  function priority(video: TMDBVideo): number {
    if (video.type === "Trailer" && video.official && video.iso_639_1 === "pt") {
      return 0;
    }
    if (video.type === "Trailer" && video.official && video.iso_639_1 === "en") {
      return 1;
    }
    if (video.type === "Trailer") return 2;
    if (video.type === "Teaser" && video.official) return 3;
    return 4;
  }

  const selected = youtubeVideos.sort(
    (a, b) =>
      priority(a) - priority(b) ||
      (b.published_at ?? "").localeCompare(a.published_at ?? "") ||
      a.id.localeCompare(b.id),
  )[0];

  return selected ? { key: selected.key, name: selected.name } : null;
}

export async function getTMDBContentPage(
  mediaType: MediaType,
  id: number,
): Promise<{
  content: ContentDetails;
  recommendations: MediaItem[];
} | null> {
  if (mediaType === "movie") {
    const [details, recommendations, watchProviders] = await Promise.all([
      getMovieDetails(id),
      getRecommendations("movie", id),
      getWatchProviders("movie", id).catch(() => null),
    ]);
    if (!isAllowedContentDetails(details)) return null;
    const overview = details.overview || "Sinopse indisponível.";
    return {
      content: {
        id: details.id,
        mediaType,
        title: details.title || details.original_title || "Título indisponível",
        year: Number.parseInt(details.release_date?.slice(0, 4) || "0", 10),
        status: translateStatus(details.status),
        audienceScore: details.vote_average ?? 0,
        imdbRating: details.vote_average ?? 0,
        posterUrl:
          getTMDBImageUrl(details.poster_path, "w500") ?? POSTER_FALLBACK,
        backdropUrl:
          getTMDBImageUrl(details.backdrop_path, "original") ??
          BACKDROP_FALLBACK,
        genres: details.genres.map((genre) => genre.name),
        tagline: details.tagline || overview,
        trailer: selectTrailer(details.videos?.results),
        watchAvailability: mapWatchAvailability(watchProviders?.results.BR),
        synopsis: [overview],
        metadata: {
          seasons: "Filme",
          releaseDate: formatDate(details.release_date),
          certification: selectCertification(details),
          network:
            details.production_companies[0]?.name ?? "Não informada",
          duration: formatRuntime(details.runtime),
        },
        cast: mapCast(details.credits),
        seasons: [],
      },
      recommendations: recommendations.slice(0, 5),
    };
  }

  const [details, recommendations, watchProviders] = await Promise.all([
    getTVShowDetails(id),
    getRecommendations("tv", id),
    getWatchProviders("tv", id).catch(() => null),
  ]);
  if (!isAllowedContentDetails(details)) return null;
  const regularSeasons = details.seasons.filter(
    (season) => season.season_number > 0,
  );
  const seasonsDetails = await Promise.all(
    regularSeasons.map((season) =>
      getTVSeasonDetails(id, season.season_number),
    ),
  );
  const overview = details.overview || "Sinopse indisponível.";
  const episodeBackdropFallback =
    getTMDBImageUrl(details.backdrop_path, "w780");
  const seriesPosterFallback =
    getTMDBImageUrl(details.poster_path, "w500") ?? EPISODE_FALLBACK;

  return {
    content: {
      id: details.id,
      mediaType,
      title: details.name || details.original_name || "Título indisponível",
      year: Number.parseInt(details.first_air_date?.slice(0, 4) || "0", 10),
      status: translateStatus(details.status),
      audienceScore: details.vote_average ?? 0,
      imdbRating: details.vote_average ?? 0,
      posterUrl:
        getTMDBImageUrl(details.poster_path, "w500") ?? POSTER_FALLBACK,
      backdropUrl:
        getTMDBImageUrl(details.backdrop_path, "original") ?? BACKDROP_FALLBACK,
      genres: details.genres.map((genre) => genre.name),
      tagline: details.tagline || overview,
      trailer: selectTrailer(details.videos?.results),
      watchAvailability: mapWatchAvailability(watchProviders?.results.BR),
      synopsis: [overview],
      metadata: {
        seasons: `${details.number_of_seasons} ${
          details.number_of_seasons === 1 ? "temporada" : "temporadas"
        }`,
        releaseDate: formatDate(details.first_air_date),
        certification: selectCertification(details),
        network: details.networks[0]?.name ?? "Não informada",
      },
      cast: mapAggregateCast(details.aggregate_credits),
      seasons: seasonsDetails.map((season) => {
        const episodeFallback =
          episodeBackdropFallback ??
          getTMDBImageUrl(season.poster_path, "w500") ??
          seriesPosterFallback;

        return {
          number: season.season_number,
          episodes: season.episodes.map((episode) =>
            mapEpisode(episode, episodeFallback),
          ),
        };
      }),
    },
    recommendations: recommendations.slice(0, 5),
  };
}
