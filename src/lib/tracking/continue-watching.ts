import { getTVSeasonDetails, getTVShowDetails } from "@/src/lib/tmdb/endpoints";
import { episodeKey, type TrackingEntry } from "./types";

export type ContinueWatchingItem = {
  seriesId: number;
  seriesTitle: string;
  episodeTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  stillPath: string | null;
  posterUrl: string | null;
  voteAverage: number;
  airDate?: string | null;
};

export async function getContinueWatchingItem(
  entry: TrackingEntry,
): Promise<ContinueWatchingItem | null> {
  if (entry.mediaType !== "tv" || entry.watchedEpisodes.length === 0) {
    return null;
  }

  const lastWatched = [...entry.watchedEpisodes].sort(
    (left, right) =>
      right.seasonNumber - left.seasonNumber ||
      right.episodeNumber - left.episodeNumber,
  )[0];
  const watched = new Set(entry.watchedEpisodes.map(episodeKey));

  try {
    const season = await getTVSeasonDetails(entry.mediaId, lastWatched.seasonNumber);
    const nextEpisode = season.episodes.find(
      (episode) =>
        episode.episode_number === lastWatched.episodeNumber + 1 &&
        !watched.has(`${season.season_number}:${episode.episode_number}`),
    );

    if (nextEpisode) {
      return {
        seriesId: entry.mediaId,
        seriesTitle: entry.title,
        episodeTitle: nextEpisode.name || `Episódio ${nextEpisode.episode_number}`,
        seasonNumber: season.season_number,
        episodeNumber: nextEpisode.episode_number,
        stillPath: nextEpisode.still_path,
        posterUrl: entry.posterUrl,
        voteAverage: nextEpisode.vote_average,
        airDate: nextEpisode.air_date,
      };
    }

    const show = await getTVShowDetails(entry.mediaId);
    const nextSeason = show.seasons
      .filter((candidate) => candidate.season_number > lastWatched.seasonNumber)
      .sort((left, right) => left.season_number - right.season_number)[0];
    if (!nextSeason) return null;

    const followingSeason = await getTVSeasonDetails(entry.mediaId, nextSeason.season_number);
    const firstEpisode = followingSeason.episodes.find(
      (episode) =>
        episode.episode_number > 0 &&
        !watched.has(`${followingSeason.season_number}:${episode.episode_number}`),
    );
    if (!firstEpisode) return null;

    return {
      seriesId: entry.mediaId,
      seriesTitle: show.name ?? entry.title,
      episodeTitle: firstEpisode.name || `Episódio ${firstEpisode.episode_number}`,
      seasonNumber: followingSeason.season_number,
      episodeNumber: firstEpisode.episode_number,
      stillPath: firstEpisode.still_path,
      posterUrl: show.poster_path
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : entry.posterUrl,
      voteAverage: firstEpisode.vote_average,
      airDate: firstEpisode.air_date,
    };
  } catch {
    return null;
  }
}

export async function getContinueWatchingItems(entries: TrackingEntry[]) {
  const items = await Promise.all(entries.map(getContinueWatchingItem));
  return items.filter(
    (item): item is ContinueWatchingItem => item !== null && Boolean(item.airDate),
  );
}
