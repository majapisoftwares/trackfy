import type { UpcomingEpisodeItem } from "@/components/upcoming-episodes-section";
import { getTVSeasonDetails, getTVShowDetails } from "@/src/lib/tmdb/endpoints";
import { episodeKey, type TrackingEntry } from "./types";

function isFutureEpisode(airDate: string | null): airDate is string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const today = `${value("year")}-${value("month")}-${value("day")}`;

  return Boolean(airDate && airDate > today);
}

async function getUpcomingEpisodeItem(entry: TrackingEntry): Promise<UpcomingEpisodeItem | null> {
  if (entry.mediaType !== "tv" || entry.watchedEpisodes.length === 0) return null;

  const lastWatched = [...entry.watchedEpisodes].sort(
    (left, right) => right.seasonNumber - left.seasonNumber || right.episodeNumber - left.episodeNumber,
  )[0];
  const watched = new Set(entry.watchedEpisodes.map(episodeKey));

  try {
    const season = await getTVSeasonDetails(entry.mediaId, lastWatched.seasonNumber);
    let nextEpisode = season.episodes.find(
      (episode) => episode.episode_number === lastWatched.episodeNumber + 1 && !watched.has(`${season.season_number}:${episode.episode_number}`),
    );

    if (!nextEpisode) {
      const show = await getTVShowDetails(entry.mediaId);
      const nextSeason = show.seasons
        .filter((candidate) => candidate.season_number > lastWatched.seasonNumber)
        .sort((left, right) => left.season_number - right.season_number)[0];
      if (!nextSeason) return null;

      const followingSeason = await getTVSeasonDetails(entry.mediaId, nextSeason.season_number);
      nextEpisode = followingSeason.episodes.find(
        (episode) => episode.episode_number > 0 && !watched.has(`${followingSeason.season_number}:${episode.episode_number}`),
      );
      if (!nextEpisode || !isFutureEpisode(nextEpisode.air_date)) return null;

      return {
        seriesId: entry.mediaId,
        seriesTitle: show.name ?? entry.title,
        episodeTitle: nextEpisode.name || `Episódio ${nextEpisode.episode_number}`,
        seasonNumber: followingSeason.season_number,
        episodeNumber: nextEpisode.episode_number,
        stillPath: nextEpisode.still_path,
        posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : entry.posterUrl,
        airDate: nextEpisode.air_date,
      };
    }

    if (!isFutureEpisode(nextEpisode.air_date)) return null;
    return {
      seriesId: entry.mediaId,
      seriesTitle: entry.title,
      episodeTitle: nextEpisode.name || `Episódio ${nextEpisode.episode_number}`,
      seasonNumber: season.season_number,
      episodeNumber: nextEpisode.episode_number,
      stillPath: nextEpisode.still_path,
      posterUrl: entry.posterUrl,
      airDate: nextEpisode.air_date,
    };
  } catch {
    return null;
  }
}

export async function getUpcomingEpisodeItems(entries: TrackingEntry[]) {
  const items = await Promise.all(entries.map(getUpcomingEpisodeItem));
  return items
    .filter((item): item is UpcomingEpisodeItem => item !== null)
    .sort((left, right) => left.airDate.localeCompare(right.airDate));
}
