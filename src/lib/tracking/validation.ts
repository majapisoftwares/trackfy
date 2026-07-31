import type {
  EpisodeTrackingPatch,
  TrackedEpisode,
  TrackingEntryPatch,
} from "./types";

const MAX_TITLE_LENGTH = 300;
const MAX_POSTER_URL_LENGTH = 2_000;
const MAX_EPISODES_PER_REQUEST = 2_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const title = value.trim();
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

function parsePosterUrl(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > MAX_POSTER_URL_LENGTH) {
    return undefined;
  }

  try {
    const url = new URL(value, "http://trackfy.local");
    if (
      url.origin !== "http://trackfy.local" &&
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return undefined;
    }
    return value;
  } catch {
    return undefined;
  }
}

export function parseTrackingEntryPatch(
  value: unknown,
): (TrackingEntryPatch & { title: string }) | null {
  if (!isRecord(value)) return null;
  const title = parseTitle(value.title);
  const posterUrl = parsePosterUrl(value.posterUrl);

  if (!title || (value.posterUrl !== undefined && posterUrl === undefined)) {
    return null;
  }

  if (value.inList !== undefined && typeof value.inList !== "boolean") {
    return null;
  }
  if (value.archived !== undefined && typeof value.archived !== "boolean") {
    return null;
  }
  if (value.watched !== undefined && typeof value.watched !== "boolean") {
    return null;
  }
  if (
    value.rating !== undefined &&
    value.rating !== null &&
    (typeof value.rating !== "number" ||
      !Number.isInteger(value.rating) ||
      value.rating < 1 ||
      value.rating > 5)
  ) {
    return null;
  }

  return {
    title,
    ...(posterUrl !== undefined ? { posterUrl } : {}),
    ...(typeof value.inList === "boolean" ? { inList: value.inList } : {}),
    ...(typeof value.archived === "boolean" ? { archived: value.archived } : {}),
    ...(typeof value.watched === "boolean" ? { watched: value.watched } : {}),
    ...(value.rating === null || typeof value.rating === "number"
      ? { rating: value.rating }
      : {}),
  };
}

function parseEpisode(value: unknown): TrackedEpisode | null {
  if (!isRecord(value)) return null;
  const { seasonNumber, episodeNumber } = value;

  if (
    !Number.isInteger(seasonNumber) ||
    !Number.isInteger(episodeNumber) ||
    Number(seasonNumber) < 0 ||
    Number(episodeNumber) < 1
  ) {
    return null;
  }

  return {
    seasonNumber: Number(seasonNumber),
    episodeNumber: Number(episodeNumber),
  };
}

export function parseEpisodeTrackingPatch(
  value: unknown,
): EpisodeTrackingPatch | null {
  if (!isRecord(value)) return null;
  const title = parseTitle(value.title);
  const posterUrl = parsePosterUrl(value.posterUrl);

  if (
    !title ||
    !Array.isArray(value.episodes) ||
    value.episodes.length === 0 ||
    value.episodes.length > MAX_EPISODES_PER_REQUEST ||
    typeof value.watched !== "boolean" ||
    (value.target !== "watched" && value.target !== "watchLater") ||
    (value.posterUrl !== undefined && posterUrl === undefined)
  ) {
    return null;
  }

  const episodes = value.episodes.map(parseEpisode);
  if (episodes.some((episode) => episode === null)) return null;

  return {
    title,
    ...(posterUrl !== undefined ? { posterUrl } : {}),
    episodes: episodes.filter(
      (episode): episode is TrackedEpisode => episode !== null,
    ),
    watched: value.watched,
    target: value.target,
  };
}
