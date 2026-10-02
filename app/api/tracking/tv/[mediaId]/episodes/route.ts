import type { NextRequest } from "next/server";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { logger } from "@/src/lib/server/logger";
import { updateTrackedEpisodes } from "@/src/lib/tracking/repository";
import { getContinueWatchingItem } from "@/src/lib/tracking/continue-watching";
import {
  attachTrackingSession,
  getTrackingSession,
} from "@/src/lib/tracking/session";
import { parseEpisodeTrackingPatch } from "@/src/lib/tracking/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ mediaId: string }>;
};

function isReleased(airDate: string | null | undefined): boolean {
  if (!airDate) return false;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const today = `${value("year")}-${value("month")}-${value("day")}`;
  return airDate <= today;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { mediaId: rawMediaId } = await context.params;
  const mediaId = Number(rawMediaId);

  if (!Number.isInteger(mediaId) || mediaId < 1) {
    return apiError("INVALID_MEDIA", "A série informada é inválida.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400);
  }

  const patch = parseEpisodeTrackingPatch(body);
  if (!patch) {
    return apiError(
      "INVALID_EPISODE_DATA",
      "Os dados dos episódios são inválidos.",
      400,
    );
  }

  const session = getTrackingSession(request);

  try {
    const item = await updateTrackedEpisodes(
      session.ownerId,
      mediaId,
      patch,
    );
    // Return only the replacement card the client needs instead of making it
    // refresh the entire personalized home page after every episode update.
    const candidate = patch.watched && patch.target === "watched"
      ? await getContinueWatchingItem(item)
      : null;
    const nextEpisode = candidate && isReleased(candidate.airDate)
      ? candidate
      : null;
    return attachTrackingSession(jsonNoStore({ item, nextEpisode }), session);
  } catch (error) {
    logger.error(error, "EPISODE_TRACKING_UPDATE_ERROR");
    return apiError(
      "TRACKING_UNAVAILABLE",
      "Não foi possível salvar os episódios.",
      503,
    );
  }
}
