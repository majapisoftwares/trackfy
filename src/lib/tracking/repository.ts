import type { Collection, Filter } from "mongodb";
import { getDatabase } from "@/src/lib/server/mongodb";
import type {
  EpisodeTrackingPatch,
  TrackedEpisode,
  TrackingEntry,
  TrackingEntryPatch,
  TrackingMediaType,
} from "./types";
import { episodeKey } from "./types";

type TrackingEntryDocument = {
  ownerId: string;
  mediaType: TrackingMediaType;
  mediaId: number;
  title: string;
  posterUrl: string | null;
  inList: boolean;
  watched: boolean;
  rating: number | null;
  watchedEpisodes: TrackedEpisode[];
  watchLaterEpisodes: TrackedEpisode[];
  createdAt: Date;
  updatedAt: Date;
};

declare global {
  var _trackfyTrackingIndexesPromise: Promise<unknown> | undefined;
}

async function getTrackingCollection(): Promise<
  Collection<TrackingEntryDocument>
> {
  const database = await getDatabase();
  const collection =
    database.collection<TrackingEntryDocument>("tracking_entries");

  if (!global._trackfyTrackingIndexesPromise) {
    global._trackfyTrackingIndexesPromise = Promise.all([
      collection.createIndex(
        { ownerId: 1, mediaType: 1, mediaId: 1 },
        { unique: true },
      ),
      collection.createIndex({ ownerId: 1, updatedAt: -1 }),
    ]);
  }

  await global._trackfyTrackingIndexesPromise;
  return collection;
}

function toTrackingEntry(document: TrackingEntryDocument): TrackingEntry {
  return {
    mediaType: document.mediaType,
    mediaId: document.mediaId,
    title: document.title,
    posterUrl: document.posterUrl,
    inList: document.inList,
    watched: document.watched,
    rating: document.rating,
    watchedEpisodes: document.watchedEpisodes,
    watchLaterEpisodes: document.watchLaterEpisodes,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function entryFilter(
  ownerId: string,
  mediaType: TrackingMediaType,
  mediaId: number,
): Filter<TrackingEntryDocument> {
  return { ownerId, mediaType, mediaId };
}

export async function findTrackingEntry(
  ownerId: string,
  mediaType: TrackingMediaType,
  mediaId: number,
): Promise<TrackingEntry | null> {
  const collection = await getTrackingCollection();
  const document = await collection.findOne(
    entryFilter(ownerId, mediaType, mediaId),
  );
  return document ? toTrackingEntry(document) : null;
}

export async function listTrackingEntries(
  ownerId: string,
  options: {
    mediaType?: TrackingMediaType;
    inList?: boolean;
    limit: number;
    offset: number;
  },
): Promise<{ items: TrackingEntry[]; total: number }> {
  const collection = await getTrackingCollection();
  const filter: Filter<TrackingEntryDocument> = {
    ownerId,
    ...(options.mediaType ? { mediaType: options.mediaType } : {}),
    ...(options.inList === undefined ? {} : { inList: options.inList }),
  };

  const [documents, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    items: documents.map(toTrackingEntry),
    total,
  };
}

export async function updateTrackingEntry(
  ownerId: string,
  mediaType: TrackingMediaType,
  mediaId: number,
  patch: TrackingEntryPatch & { title: string },
): Promise<TrackingEntry> {
  const collection = await getTrackingCollection();
  const now = new Date();
  const setValues: Partial<TrackingEntryDocument> = {
    title: patch.title,
    updatedAt: now,
  };

  if (patch.posterUrl !== undefined) setValues.posterUrl = patch.posterUrl;
  if (patch.inList !== undefined) setValues.inList = patch.inList;
  if (patch.watched !== undefined) setValues.watched = patch.watched;
  if (patch.rating !== undefined) setValues.rating = patch.rating;

  const document = await collection.findOneAndUpdate(
    entryFilter(ownerId, mediaType, mediaId),
    {
      $set: setValues,
      $setOnInsert: {
        ownerId,
        mediaType,
        mediaId,
        ...(patch.posterUrl === undefined ? { posterUrl: null } : {}),
        ...(patch.inList === undefined ? { inList: false } : {}),
        ...(patch.watched === undefined ? { watched: false } : {}),
        ...(patch.rating === undefined ? { rating: null } : {}),
        watchedEpisodes: [],
        watchLaterEpisodes: [],
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (!document) {
    throw new Error("TRACKING_ENTRY_UPDATE_FAILED");
  }

  return toTrackingEntry(document);
}

function applyEpisodeChange(
  current: TrackedEpisode[],
  episodes: TrackedEpisode[],
  enabled: boolean,
): TrackedEpisode[] {
  const next = new Map(current.map((episode) => [episodeKey(episode), episode]));

  for (const episode of episodes) {
    if (enabled) {
      next.set(episodeKey(episode), episode);
    } else {
      next.delete(episodeKey(episode));
    }
  }

  return [...next.values()].sort(
    (left, right) =>
      left.seasonNumber - right.seasonNumber ||
      left.episodeNumber - right.episodeNumber,
  );
}

function mergeEpisodes(
  target: TrackedEpisode[],
  source: TrackedEpisode[],
): TrackedEpisode[] {
  return applyEpisodeChange(target, source, true);
}

export async function mergeTrackingOwners(
  sourceOwnerId: string,
  targetOwnerId: string,
): Promise<void> {
  if (sourceOwnerId === targetOwnerId) return;

  const collection = await getTrackingCollection();
  const sourceEntries = await collection
    .find({ ownerId: sourceOwnerId })
    .toArray();

  for (const sourceEntry of sourceEntries) {
    const targetEntry = await collection.findOne(
      entryFilter(
        targetOwnerId,
        sourceEntry.mediaType,
        sourceEntry.mediaId,
      ),
    );

    if (targetEntry) {
      await collection.updateOne(
        entryFilter(
          targetOwnerId,
          sourceEntry.mediaType,
          sourceEntry.mediaId,
        ),
        {
          $set: {
            title: targetEntry.title || sourceEntry.title,
            posterUrl: targetEntry.posterUrl ?? sourceEntry.posterUrl,
            inList: targetEntry.inList || sourceEntry.inList,
            watched: targetEntry.watched || sourceEntry.watched,
            rating: targetEntry.rating ?? sourceEntry.rating,
            watchedEpisodes: mergeEpisodes(
              targetEntry.watchedEpisodes,
              sourceEntry.watchedEpisodes,
            ),
            watchLaterEpisodes: mergeEpisodes(
              targetEntry.watchLaterEpisodes,
              sourceEntry.watchLaterEpisodes,
            ),
            createdAt:
              targetEntry.createdAt < sourceEntry.createdAt
                ? targetEntry.createdAt
                : sourceEntry.createdAt,
            updatedAt:
              targetEntry.updatedAt > sourceEntry.updatedAt
                ? targetEntry.updatedAt
                : sourceEntry.updatedAt,
          },
        },
      );
    } else {
      await collection.updateOne(
        entryFilter(
          targetOwnerId,
          sourceEntry.mediaType,
          sourceEntry.mediaId,
        ),
        {
          $setOnInsert: {
            ownerId: targetOwnerId,
            mediaType: sourceEntry.mediaType,
            mediaId: sourceEntry.mediaId,
            title: sourceEntry.title,
            posterUrl: sourceEntry.posterUrl,
            inList: sourceEntry.inList,
            watched: sourceEntry.watched,
            rating: sourceEntry.rating,
            watchedEpisodes: sourceEntry.watchedEpisodes,
            watchLaterEpisodes: sourceEntry.watchLaterEpisodes,
            createdAt: sourceEntry.createdAt,
            updatedAt: sourceEntry.updatedAt,
          },
        },
        { upsert: true },
      );
    }
  }

  await collection.deleteMany({ ownerId: sourceOwnerId });
}

export async function updateTrackedEpisodes(
  ownerId: string,
  mediaId: number,
  patch: EpisodeTrackingPatch,
): Promise<TrackingEntry> {
  const current =
    (await findTrackingEntry(ownerId, "tv", mediaId)) ??
    (await updateTrackingEntry(ownerId, "tv", mediaId, {
      title: patch.title,
      posterUrl: patch.posterUrl,
    }));
  const field =
    patch.target === "watched" ? "watchedEpisodes" : "watchLaterEpisodes";
  const nextEpisodes = applyEpisodeChange(
    current[field],
    patch.episodes,
    patch.watched,
  );
  const collection = await getTrackingCollection();
  const document = await collection.findOneAndUpdate(
    entryFilter(ownerId, "tv", mediaId),
    {
      $set: {
        title: patch.title,
        posterUrl: patch.posterUrl ?? current.posterUrl,
        [field]: nextEpisodes,
        ...(patch.target === "watched" && patch.watched
          ? { inList: true }
          : {}),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!document) {
    throw new Error("TRACKED_EPISODE_UPDATE_FAILED");
  }

  return toTrackingEntry(document);
}

export async function deleteTrackingEntry(
  ownerId: string,
  mediaType: TrackingMediaType,
  mediaId: number,
): Promise<boolean> {
  const collection = await getTrackingCollection();
  const result = await collection.deleteOne(
    entryFilter(ownerId, mediaType, mediaId),
  );
  return result.deletedCount > 0;
}
