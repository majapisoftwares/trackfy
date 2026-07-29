import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/lib/server/logger";
import { mergeTrackingOwners } from "@/src/lib/tracking/repository";
import {
  attachTrackingOwner,
  getTrackingOwnerId,
} from "@/src/lib/tracking/session";
import {
  createAuthSession,
  type AuthUser,
} from "./repository";
import { attachAuthSession } from "./session";

export async function establishUserSession(
  request: NextRequest,
  response: NextResponse,
  user: AuthUser,
): Promise<NextResponse> {
  const previousOwnerId = getTrackingOwnerId(request);
  const session = await createAuthSession(user.id);

  if (previousOwnerId && previousOwnerId !== user.ownerId) {
    try {
      await mergeTrackingOwners(previousOwnerId, user.ownerId);
    } catch (error) {
      logger.warn(
        { error, previousOwnerId, userId: user.id },
        "TRACKING_OWNER_MIGRATION_ERROR",
      );
    }
  }

  attachAuthSession(response, session);
  attachTrackingOwner(response, user.ownerId);
  return response;
}
