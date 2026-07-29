export const TRACKING_MEDIA_TYPES = ["movie", "tv"] as const;

export type TrackingMediaType = (typeof TRACKING_MEDIA_TYPES)[number];

export type TrackedEpisode = {
  seasonNumber: number;
  episodeNumber: number;
};

export type TrackingEntry = {
  mediaType: TrackingMediaType;
  mediaId: number;
  title: string;
  posterUrl: string | null;
  inList: boolean;
  watched: boolean;
  rating: number | null;
  watchedEpisodes: TrackedEpisode[];
  watchLaterEpisodes: TrackedEpisode[];
  createdAt: string;
  updatedAt: string;
};

export type TrackingEntryPatch = {
  title?: string;
  posterUrl?: string | null;
  inList?: boolean;
  watched?: boolean;
  rating?: number | null;
};

export type EpisodeTrackingPatch = {
  title: string;
  posterUrl?: string | null;
  episodes: TrackedEpisode[];
  watched: boolean;
  target: "watched" | "watchLater";
};

export function isTrackingMediaType(
  value: string,
): value is TrackingMediaType {
  return TRACKING_MEDIA_TYPES.some((mediaType) => mediaType === value);
}

export function episodeKey(episode: TrackedEpisode): string {
  return `${episode.seasonNumber}:${episode.episodeNumber}`;
}
