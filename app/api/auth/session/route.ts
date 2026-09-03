import type { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/auth/session";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";
import { getUserPoints } from "@/src/lib/ranking-points";
import { getUserRank } from "@/src/lib/ranking";
import { listTrackingEntries } from "@/src/lib/tracking/repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    let rank = getUserRank(0);

    if (user) {
      try {
        const tracking = await listTrackingEntries(user.ownerId, {
          limit: 1_000,
          offset: 0,
        });
        rank = getUserRank(await getUserPoints(tracking.items));
      } catch (error) {
        logger.warn(error, "AUTH_RANK_UNAVAILABLE");
      }
    }

    return jsonNoStore({
      user: user
        ? { id: user.id, email: user.email, nickname: user.nickname, rank }
        : null,
    });
  } catch (error) {
    logger.error(error, "AUTH_SESSION_ERROR");
    return apiError(
      "AUTH_UNAVAILABLE",
      "Não foi possível consultar sua sessão.",
      503,
    );
  }
}
