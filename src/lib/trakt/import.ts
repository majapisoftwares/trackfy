import type { TrackedEpisode, TrackingMediaType } from "@/src/lib/tracking/types";

const MAX_IMPORT_ITEMS = 1_000;

type UnknownRecord = Record<string, unknown>;

export type TraktImportItem = {
  mediaType: TrackingMediaType;
  tmdbId: number;
  title: string;
  watched: boolean;
  inList: boolean;
  rating: number | null;
  watchedEpisodes: TrackedEpisode[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 300 ? normalized : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function tmdbId(media: unknown): number | null {
  if (!isRecord(media)) return null;
  const ids = isRecord(media.ids) ? media.ids : media;
  return positiveInteger(ids.tmdb);
}

function mediaTitle(media: unknown): string | null {
  return isRecord(media) ? text(media.title) : null;
}

function toRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(5, Math.max(1, Math.round(value / 2)));
}

function episodesFromSeasons(value: unknown): TrackedEpisode[] {
  const episodes = new Map<string, TrackedEpisode>();
  for (const season of asArray(value)) {
    if (!isRecord(season)) continue;
    const seasonNumber =
      typeof season.number === "number" && Number.isInteger(season.number) && season.number >= 0
        ? season.number
        : null;
    if (seasonNumber === null) continue;
    for (const episode of asArray(season.episodes)) {
      if (!isRecord(episode)) continue;
      const episodeNumber = positiveInteger(episode.number);
      if (episodeNumber === null) continue;
      const item = { seasonNumber, episodeNumber };
      episodes.set(`${seasonNumber}:${episodeNumber}`, item);
    }
  }
  return [...episodes.values()].sort(
    (left, right) =>
      left.seasonNumber - right.seasonNumber ||
      left.episodeNumber - right.episodeNumber,
  );
}

function createItem(
  mediaType: TrackingMediaType,
  media: unknown,
  values: Omit<TraktImportItem, "mediaType" | "tmdbId" | "title">,
): TraktImportItem | null {
  const id = tmdbId(media);
  const title = mediaTitle(media);
  if (id === null || title === null) return null;
  return { mediaType, tmdbId: id, title, ...values };
}

function parseEntry(entry: unknown, source: string): TraktImportItem[] {
  if (!isRecord(entry)) return [];

  const type = entry.type;
  const isWatchlist = source.includes("watchlist") || entry.watchlisted_at !== undefined;
  const isRating = source.includes("rating") || entry.rating !== undefined;
  const isRatingOnly = source.includes("rating") && entry.watched_at === undefined;
  const isWatched =
    !isWatchlist &&
    !isRatingOnly &&
    (source.includes("watched") ||
      source.includes("history") ||
      entry.watched_at !== undefined ||
      entry.last_watched_at !== undefined ||
      entry.action === "watch" ||
      positiveInteger(entry.plays) !== null);
  const rating = isRating ? toRating(entry.rating) : null;

  if (type === "episode" || (isRecord(entry.episode) && isRecord(entry.show))) {
    const show = entry.show;
    const episode = isRecord(entry.episode) ? entry.episode : null;
    const seasonNumber = episode && typeof episode.season === "number" && Number.isInteger(episode.season) && episode.season >= 0
      ? episode.season
      : null;
    const episodeNumber = episode ? positiveInteger(episode.number) : null;
    const item = createItem("tv", show, {
      watched: isWatched,
      inList: isWatchlist,
      rating,
      watchedEpisodes:
        seasonNumber !== null && episodeNumber !== null
          ? [{ seasonNumber, episodeNumber }]
          : [],
    });
    return item ? [item] : [];
  }

  const movie = isRecord(entry.movie) ? entry.movie : null;
  if (type === "movie" || movie) {
    const item = createItem("movie", movie ?? entry, {
      watched: isWatched,
      inList: isWatchlist,
      rating,
      watchedEpisodes: [],
    });
    return item ? [item] : [];
  }

  const show = isRecord(entry.show) ? entry.show : null;
  if (type === "show" || type === "tv" || show) {
    const watchedEpisodes = episodesFromSeasons(entry.seasons);
    const item = createItem("tv", show ?? entry, {
      watched: isWatched && watchedEpisodes.length === 0,
      inList: isWatchlist || watchedEpisodes.length > 0,
      rating,
      watchedEpisodes,
    });
    return item ? [item] : [];
  }

  return [];
}

function collectEntries(data: unknown, sourceName: string): Array<{ entry: unknown; source: string }> {
  if (Array.isArray(data)) return data.map((entry) => ({ entry, source: sourceName || "items" }));
  if (!isRecord(data)) return [];

  if (data.type !== undefined || data.movie !== undefined || data.show !== undefined) {
    return [{ entry: data, source: sourceName || "items" }];
  }

  const entries: Array<{ entry: unknown; source: string }> = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      entries.push(...value.map((entry) => ({ entry, source: key })));
    } else if (isRecord(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (Array.isArray(nestedValue)) {
          entries.push(
            ...nestedValue.map((entry) => ({ entry, source: `${key}-${nestedKey}` })),
          );
        }
      }
    }
  }
  return entries;
}

export function parseTraktImport(data: unknown, sourceName = ""): {
  items: TraktImportItem[];
  invalid: number;
  overLimit: boolean;
} {
  const entries = collectEntries(data, sourceName.toLowerCase());
  if (entries.length > MAX_IMPORT_ITEMS) {
    return { items: [], invalid: 0, overLimit: true };
  }

  const merged = new Map<string, TraktImportItem>();
  let invalid = 0;
  for (const { entry, source } of entries) {
    const parsed = parseEntry(entry, source);
    if (parsed.length === 0) {
      invalid += 1;
      continue;
    }
    for (const item of parsed) {
      const key = `${item.mediaType}:${item.tmdbId}`;
      const current = merged.get(key);
      if (!current) {
        merged.set(key, item);
        continue;
      }
      const episodeMap = new Map(
        [...current.watchedEpisodes, ...item.watchedEpisodes].map((episode) => [
          `${episode.seasonNumber}:${episode.episodeNumber}`,
          episode,
        ]),
      );
      merged.set(key, {
        ...current,
        watched: current.watched || item.watched,
        inList: current.inList || item.inList,
        rating: item.rating ?? current.rating,
        watchedEpisodes: [...episodeMap.values()],
      });
    }
  }

  return { items: [...merged.values()], invalid, overLimit: false };
}
