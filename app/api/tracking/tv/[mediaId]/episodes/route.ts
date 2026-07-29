import type { NextRequest } from "next/server";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";
import { updateTrackedEpisodes } from "@/src/lib/tracking/repository";
import {
  attachTrackingSession,
  getTrackingSession,
} from "@/src/lib/tracking/session";
import { parseEpisodeTrackingPatch } from "@/src/lib/tracking/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ mediaId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    return attachTrackingSession(jsonNoStore({ item }), session);
  } catch (error) {
    logger.error(error, "EPISODE_TRACKING_UPDATE_ERROR");
    return apiError(
      "TRACKING_UNAVAILABLE",
      "Não foi possível salvar os episódios.",
      503,
    );
  }
}
