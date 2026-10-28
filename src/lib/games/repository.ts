import type { Collection, Filter } from "mongodb";
import { getDatabase } from "@/src/lib/server/mongodb";
import type { UserGame, UserGamePatch } from "./types";
import { GAME_STATUSES, type GameStatus } from "./types";

type UserGameDocument = Omit<UserGame, "createdAt" | "updatedAt" | "completedAt"> & {
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

declare global { var _trackfyUserGameIndexesPromise: Promise<unknown> | undefined; }

async function collection(): Promise<Collection<UserGameDocument>> {
  const database = await getDatabase();
  const items = database.collection<UserGameDocument>("user_games");
  if (!global._trackfyUserGameIndexesPromise) {
    global._trackfyUserGameIndexesPromise = Promise.all([
      items.createIndex({ ownerId: 1, gameId: 1 }, { unique: true }),
      items.createIndex({ ownerId: 1, status: 1, updatedAt: -1 }),
    ]);
  }
  await global._trackfyUserGameIndexesPromise;
  return items;
}

function toUserGame(document: UserGameDocument): UserGame {
  return {
    gameId: document.gameId, slug: document.slug, name: document.name, coverUrl: document.coverUrl,
    status: document.status, personalRating: document.personalRating, platform: document.platform,
    hoursPlayed: document.hoursPlayed, completedAt: document.completedAt?.toISOString() ?? null,
    createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString(),
  };
}

const filterFor = (ownerId: string, gameId: number): Filter<UserGameDocument> => ({ ownerId, gameId });

export async function findUserGame(ownerId: string, gameId: number): Promise<UserGame | null> {
  const item = await (await collection()).findOne(filterFor(ownerId, gameId));
  return item ? toUserGame(item) : null;
}

export async function listUserGames(ownerId: string): Promise<UserGame[]> {
  return (await (await collection()).find({ ownerId }).sort({ updatedAt: -1 }).toArray()).map(toUserGame);
}

export async function saveUserGame(ownerId: string, gameId: number, patch: UserGamePatch & { slug: string; name: string }): Promise<UserGame> {
  const items = await collection();
  const now = new Date();
  const setValues: Partial<UserGameDocument> = { slug: patch.slug, name: patch.name, updatedAt: now };
  if (patch.coverUrl !== undefined) setValues.coverUrl = patch.coverUrl;
  if (patch.status !== undefined) setValues.status = patch.status;
  if (patch.personalRating !== undefined) setValues.personalRating = patch.personalRating;
  if (patch.platform !== undefined) setValues.platform = patch.platform;
  if (patch.hoursPlayed !== undefined) setValues.hoursPlayed = patch.hoursPlayed;
  if (patch.completedAt !== undefined) setValues.completedAt = patch.completedAt ? new Date(patch.completedAt) : null;
  const insertValues: Partial<UserGameDocument> = { ownerId, gameId, createdAt: now };
  if (patch.coverUrl === undefined) insertValues.coverUrl = null;
  if (patch.status === undefined) insertValues.status = "wishlist";
  if (patch.personalRating === undefined) insertValues.personalRating = null;
  if (patch.platform === undefined) insertValues.platform = null;
  if (patch.hoursPlayed === undefined) insertValues.hoursPlayed = null;
  if (patch.completedAt === undefined) insertValues.completedAt = null;
  const document = await items.findOneAndUpdate(filterFor(ownerId, gameId), {
    $set: setValues,
    $setOnInsert: insertValues,
  }, { upsert: true, returnDocument: "after" });
  if (!document) throw new Error("USER_GAME_UPDATE_FAILED");
  return toUserGame(document);
}

export async function deleteUserGame(ownerId: string, gameId: number): Promise<boolean> {
  return (await (await collection()).deleteOne(filterFor(ownerId, gameId))).deletedCount > 0;
}

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === "string" && GAME_STATUSES.includes(value as GameStatus);
}
