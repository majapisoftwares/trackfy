import type { NextRequest } from "next/server";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";
import { listTrackingEntries } from "@/src/lib/tracking/repository";
import {
  attachTrackingSession,
  getTrackingSession,
} from "@/src/lib/tracking/session";
import { isTrackingMediaType } from "@/src/lib/tracking/types";

export const runtime = "nodejs";

function parseBoundedInteger(
  value: string | null,
  fallback: number,
  maximum: number,
): number | null {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= maximum
    ? parsed
    : null;
}

export async function GET(request: NextRequest) {
  const rawMediaType = request.nextUrl.searchParams.get("mediaType");
  const mediaType =
    rawMediaType && isTrackingMediaType(rawMediaType)
      ? rawMediaType
      : undefined;
  const limit = parseBoundedInteger(
    request.nextUrl.searchParams.get("limit"),
    20,
    100,
  );
  const offset = parseBoundedInteger(
    request.nextUrl.searchParams.get("offset"),
    0,
    10_000,
  );

  if ((rawMediaType && !mediaType) || limit === null || offset === null) {
    return apiError(
      "INVALID_QUERY",
      "Os filtros informados são inválidos.",
      400,
    );
  }

  const session = getTrackingSession(request);

  try {
    const result = await listTrackingEntries(session.ownerId, {
      mediaType,
      limit,
      offset,
    });
    return attachTrackingSession(jsonNoStore(result), session);
  } catch (error) {
    logger.error(error, "TRACKING_LIST_ERROR");
    return apiError(
      "TRACKING_UNAVAILABLE",
      "Não foi possível carregar sua lista.",
      503,
    );
  }
}
