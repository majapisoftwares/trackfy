import type { NextRequest } from "next/server";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { logger } from "@/src/lib/server/logger";
import {
  deleteTrackingEntry,
  findTrackingEntry,
  updateTrackingEntry,
} from "@/src/lib/tracking/repository";
import {
  attachTrackingSession,
  getTrackingSession,
} from "@/src/lib/tracking/session";
import { isTrackingMediaType } from "@/src/lib/tracking/types";
import { parseTrackingEntryPatch } from "@/src/lib/tracking/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ mediaType: string; mediaId: string }>;
};

async function parseRoute(context: RouteContext) {
  const { mediaType, mediaId: rawMediaId } = await context.params;
  const mediaId = Number(rawMediaId);

  if (
    !isTrackingMediaType(mediaType) ||
    !Number.isInteger(mediaId) ||
    mediaId < 1
  ) {
    return null;
  }

  return { mediaType, mediaId };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const route = await parseRoute(context);
  if (!route) {
    return apiError(
      "INVALID_MEDIA",
      "O filme ou a série informada é inválida.",
      400,
    );
  }

  const session = getTrackingSession(request);

  try {
    const item = await findTrackingEntry(
      session.ownerId,
      route.mediaType,
      route.mediaId,
    );
    return attachTrackingSession(jsonNoStore({ item }), session);
  } catch (error) {
    logger.error(error, "TRACKING_FETCH_ERROR");
    return apiError(
      "TRACKING_UNAVAILABLE",
      "Não foi possível carregar seu progresso.",
      503,
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const route = await parseRoute(context);
  if (!route) {
    return apiError(
      "INVALID_MEDIA",
      "O filme ou a série informada é inválida.",
      400,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400);
  }

  const patch = parseTrackingEntryPatch(body);
  if (!patch) {
    return apiError(
      "INVALID_TRACKING_DATA",
      "Os dados de acompanhamento são inválidos.",
      400,
    );
  }

  const session = getTrackingSession(request);

  try {
    const item = await updateTrackingEntry(
      session.ownerId,
      route.mediaType,
      route.mediaId,
      patch,
    );
    return attachTrackingSession(jsonNoStore({ item }), session);
  } catch (error) {
    logger.error(error, "TRACKING_UPDATE_ERROR");
    return apiError(
      "TRACKING_UNAVAILABLE",
      "Não foi possível salvar seu progresso.",
      503,
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const route = await parseRoute(context);
  if (!route) {
    return apiError(
      "INVALID_MEDIA",
      "O filme ou a série informada é inválida.",
      400,
    );
  }

  const session = getTrackingSession(request);

  try {
    const deleted = await deleteTrackingEntry(
      session.ownerId,
      route.mediaType,
      route.mediaId,
    );
    return attachTrackingSession(jsonNoStore({ deleted }), session);
  } catch (error) {
    logger.error(error, "TRACKING_DELETE_ERROR");
    return apiError(
      "TRACKING_UNAVAILABLE",
      "Não foi possível remover o item.",
      503,
    );
  }
}
