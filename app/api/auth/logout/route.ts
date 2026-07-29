import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import {
  clearAuthSession,
  getAuthToken,
} from "@/src/lib/auth/session";
import { deleteAuthSession } from "@/src/lib/auth/repository";
import { jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";
import { attachTrackingOwner } from "@/src/lib/tracking/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = getAuthToken(request);

  if (token) {
    try {
      await deleteAuthSession(token);
    } catch (error) {
      logger.warn({ error }, "AUTH_LOGOUT_SESSION_DELETE_ERROR");
    }
  }

  const response = jsonNoStore({ success: true });
  clearAuthSession(response);
  attachTrackingOwner(response, randomUUID());
  return response;
}
