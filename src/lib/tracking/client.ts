"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  EpisodeTrackingPatch,
  TrackingEntry,
  TrackingEntryPatch,
  TrackingMediaType,
} from "./types";
import { episodeKey } from "./types";

type TrackingMetadata = {
  title: string;
  posterUrl?: string | null;
};

type ApiPayload = {
  item: TrackingEntry | null;
  error?: string;
};

async function readPayload(response: Response): Promise<ApiPayload> {
  const payload = (await response.json()) as ApiPayload;
  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível salvar seu progresso.");
  }
  return payload;
}

function trackingUrl(mediaType: TrackingMediaType, mediaId: number): string {
  return `/api/tracking/${mediaType}/${mediaId}`;
}

function createOptimisticEntry(
  mediaType: TrackingMediaType,
  mediaId: number,
  metadata: TrackingMetadata,
): TrackingEntry {
  const now = new Date().toISOString();
  return {
    mediaType,
    mediaId,
    title: metadata.title,
    posterUrl: metadata.posterUrl ?? null,
    inList: false,
    archived: false,
    watched: false,
    rating: null,
    watchedEpisodes: [],
    watchLaterEpisodes: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function useTracking(
  mediaType: TrackingMediaType,
  mediaId: number,
  metadata: TrackingMetadata,
) {
  const queryClient = useQueryClient();
  const queryKey = ["tracking", mediaType, mediaId] as const;
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(trackingUrl(mediaType, mediaId), {
        credentials: "same-origin",
      });
      return (await readPayload(response)).item;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: TrackingEntryPatch) => {
      const response = await fetch(trackingUrl(mediaType, mediaId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...metadata, ...patch }),
      });
      return (await readPayload(response)).item;
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TrackingEntry | null>(queryKey);
      const current =
        previous ?? createOptimisticEntry(mediaType, mediaId, metadata);
      const shouldArchiveWatchedListItem = patch.watched === true && current.inList;
      queryClient.setQueryData<TrackingEntry>(queryKey, {
        ...current,
        ...patch,
        ...(shouldArchiveWatchedListItem
          ? { inList: false, archived: true }
          : {}),
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null);
    },
    onSuccess: (item) => {
      queryClient.setQueryData(queryKey, item);
    },
  });

  const episodeMutation = useMutation({
    mutationFn: async (
      patch: Omit<EpisodeTrackingPatch, "title" | "posterUrl">,
    ) => {
      const response = await fetch(`/api/tracking/tv/${mediaId}/episodes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...metadata, ...patch }),
      });
      return (await readPayload(response)).item;
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TrackingEntry | null>(queryKey);
      const current =
        previous ?? createOptimisticEntry(mediaType, mediaId, metadata);
      const field =
        patch.target === "watched"
          ? "watchedEpisodes"
          : "watchLaterEpisodes";
      const episodes = new Map(
        current[field].map((episode) => [episodeKey(episode), episode]),
      );

      for (const episode of patch.episodes) {
        if (patch.watched) {
          episodes.set(episodeKey(episode), episode);
        } else {
          episodes.delete(episodeKey(episode));
        }
      }

      queryClient.setQueryData<TrackingEntry>(queryKey, {
        ...current,
        ...(patch.target === "watched" && patch.watched
          ? { inList: true }
          : {}),
        [field]: [...episodes.values()],
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null);
    },
    onSuccess: (item) => {
      queryClient.setQueryData(queryKey, item);
    },
  });

  return {
    entry: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? updateMutation.error ?? episodeMutation.error,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    updateEpisodes: episodeMutation.mutate,
  };
}
