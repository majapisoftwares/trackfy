import { getTVShowDetails } from "@/src/lib/tmdb/endpoints";
import type { TrackingEntry } from "@/src/lib/tracking/types";
import { episodeKey } from "@/src/lib/tracking/types";

const MOVIE_POINTS = 10;
const EPISODE_POINTS = 3;
const COMPLETED_SEASON_POINTS = 25;
const COMPLETED_SERIES_POINTS = 75;

type TVCompletion = {
  episodePoints: number;
  completedSeasons: number;
  completedSeries: boolean;
};

function uniqueWatchedEpisodes(entry: TrackingEntry) {
  return new Map(
    entry.watchedEpisodes.map((episode) => [episodeKey(episode), episode]),
  );
}

async function getTVCompletion(entry: TrackingEntry): Promise<TVCompletion> {
  const watchedEpisodes = uniqueWatchedEpisodes(entry);

  try {
    const details = await getTVShowDetails(entry.mediaId);
    const seasons = details.seasons.filter(
      (season) => season.season_number > 0 && season.episode_count > 0,
    );
    const completedSeasons = entry.watched
      ? seasons.length
      : seasons.filter(
          (season) =>
            [...watchedEpisodes.values()].filter(
              (episode) => episode.seasonNumber === season.season_number,
            ).length >= season.episode_count,
        ).length;
    const totalEpisodes = entry.watched
      ? seasons.reduce((total, season) => total + season.episode_count, 0)
      : watchedEpisodes.size;
    const completedSeries =
      entry.watched || (seasons.length > 0 && completedSeasons === seasons.length);

    return {
      episodePoints: totalEpisodes * EPISODE_POINTS,
      completedSeasons,
      completedSeries,
    };
  } catch {
    // A TMDB failure must not hide the points for episodes already stored.
    return {
      episodePoints: watchedEpisodes.size * EPISODE_POINTS,
      completedSeasons: 0,
      completedSeries: entry.watched,
    };
  }
}

/** Calcula a pontuação interna sem expor pontos ou progresso na interface. */
export async function getUserPoints(entries: TrackingEntry[]): Promise<number> {
  const moviePoints = entries.filter(
    (entry) => entry.mediaType === "movie" && entry.watched,
  ).length * MOVIE_POINTS;
  const tvEntries = entries.filter((entry) => entry.mediaType === "tv");
  const tvCompletions = await Promise.all(tvEntries.map(getTVCompletion));

  return (
    moviePoints +
    tvCompletions.reduce(
      (total, completion) =>
        total +
        completion.episodePoints +
        completion.completedSeasons * COMPLETED_SEASON_POINTS +
        (completion.completedSeries ? COMPLETED_SERIES_POINTS : 0),
      0,
    )
  );
}
