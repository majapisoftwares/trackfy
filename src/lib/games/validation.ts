import type { UserGamePatch } from "./types";
import { isGameStatus } from "./repository";

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, maximum: number) => typeof value === "string" && value.trim() && value.trim().length <= maximum ? value.trim() : null;

export function parseUserGamePatch(value: unknown): (UserGamePatch & { slug: string; name: string }) | null {
  if (!isRecord(value)) return null;
  const slug = text(value.slug, 200); const name = text(value.name, 300);
  if (!slug || !name || (value.status !== undefined && !isGameStatus(value.status))) return null;
  const coverUrl = value.coverUrl;
  if (coverUrl !== undefined && coverUrl !== null && (typeof coverUrl !== "string" || coverUrl.length > 2000 || !/^https:\/\//.test(coverUrl))) return null;
  if (value.personalRating !== undefined && value.personalRating !== null && (typeof value.personalRating !== "number" || !Number.isInteger(value.personalRating) || value.personalRating < 1 || value.personalRating > 5)) return null;
  if (value.platform !== undefined && value.platform !== null && (typeof value.platform !== "string" || value.platform.trim().length > 120)) return null;
  if (value.hoursPlayed !== undefined && value.hoursPlayed !== null && (typeof value.hoursPlayed !== "number" || value.hoursPlayed < 0 || value.hoursPlayed > 100000)) return null;
  if (value.completedAt !== undefined && value.completedAt !== null && (typeof value.completedAt !== "string" || Number.isNaN(Date.parse(value.completedAt)))) return null;
  return {
    slug, name, ...(coverUrl !== undefined ? { coverUrl: coverUrl as string | null } : {}),
    ...(isGameStatus(value.status) ? { status: value.status } : {}),
    ...(value.personalRating === null || typeof value.personalRating === "number" ? { personalRating: value.personalRating } : {}),
    ...(value.platform === null || typeof value.platform === "string" ? { platform: value.platform?.trim() || null } : {}),
    ...(value.hoursPlayed === null || typeof value.hoursPlayed === "number" ? { hoursPlayed: value.hoursPlayed } : {}),
    ...(value.completedAt === null || typeof value.completedAt === "string" ? { completedAt: value.completedAt } : {}),
  };
}
