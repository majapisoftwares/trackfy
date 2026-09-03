import { getTVSeasonDetails } from "@/src/lib/tmdb/endpoints";
import type { TrackingEntry } from "./types";

export type HistoryEpisodeItem = {
  seriesId: number;
  seriesTitle: string;
  episodeTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  stillPath: string | null;
  posterUrl: string | null;
  voteAverage: number;
  watchedAt?: string | null;
};

type FlatWatchedEpisode = {
  seriesId: number;
  seriesTitle: string;
  posterUrl: string | null;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt?: string;
  updatedAt: string;
};

export async function getWatchHistoryItems(
  entries: TrackingEntry[],
  limit = 12,
): Promise<HistoryEpisodeItem[]> {
  const tvEntries = entries.filter(
    (entry) => entry.mediaType === "tv" && entry.watchedEpisodes.length > 0,
  );

  if (tvEntries.length === 0) return [];

  // For each tracked TV show, pick ONLY the single latest watched episode
  const latestWatchedPerSeries: FlatWatchedEpisode[] = [];

  for (const entry of tvEntries) {
    if (entry.watchedEpisodes.length === 0) continue;

    // Sort episodes for this series to find the single latest one
    const sortedEpisodes = [...entry.watchedEpisodes].sort((a, b) => {
      const aWatchedAt = (a as { watchedAt?: string }).watchedAt;
      const bWatchedAt = (b as { watchedAt?: string }).watchedAt;
      if (aWatchedAt && bWatchedAt) {
        return bWatchedAt.localeCompare(aWatchedAt);
      }
      if (aWatchedAt) return -1;
      if (bWatchedAt) return 1;
      if (b.seasonNumber !== a.seasonNumber) return b.seasonNumber - a.seasonNumber;
      return b.episodeNumber - a.episodeNumber;
    });

    const latest = sortedEpisodes[0];
    if (latest) {
      latestWatchedPerSeries.push({
        seriesId: entry.mediaId,
        seriesTitle: entry.title,
        posterUrl: entry.posterUrl,
        seasonNumber: latest.seasonNumber,
        episodeNumber: latest.episodeNumber,
        watchedAt: (latest as { watchedAt?: string }).watchedAt ?? entry.updatedAt,
        updatedAt: entry.updatedAt,
      });
    }
  }

  // Sort series by their latest watched date
  latestWatchedPerSeries.sort((a, b) => {
    if (a.watchedAt && b.watchedAt) {
      return b.watchedAt.localeCompare(a.watchedAt);
    }
    if (a.watchedAt) return -1;
    if (b.watchedAt) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const selected = latestWatchedPerSeries.slice(0, limit);

  // Group by seriesId and seasonNumber to avoid duplicate network calls
  const seasonCache = new Map<
    string,
    Promise<{
      episodes?: Array<{
        episode_number: number;
        name?: string;
        still_path?: string | null;
        vote_average?: number;
      }>;
    } | null>
  >();

  for (const item of selected) {
    const key = `${item.seriesId}:${item.seasonNumber}`;
    if (!seasonCache.has(key)) {
      seasonCache.set(
        key,
        getTVSeasonDetails(item.seriesId, item.seasonNumber).catch(() => null),
      );
    }
  }

  const results = await Promise.all(
    selected.map(async (item) => {
      const seasonData = await seasonCache.get(
        `${item.seriesId}:${item.seasonNumber}`,
      );
      const episodeData = seasonData?.episodes?.find(
        (ep) => ep.episode_number === item.episodeNumber,
      );

      return {
        seriesId: item.seriesId,
        seriesTitle: item.seriesTitle,
        episodeTitle:
          episodeData?.name || `Episódio ${item.episodeNumber}`,
        seasonNumber: item.seasonNumber,
        episodeNumber: item.episodeNumber,
        stillPath: episodeData?.still_path ?? null,
        posterUrl: item.posterUrl,
        voteAverage: episodeData?.vote_average ?? 0,
        watchedAt: item.watchedAt ?? item.updatedAt,
      };
    }),
  );

  return results;
}
