import type { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/auth/session";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    return jsonNoStore({
      user: user ? { id: user.id, email: user.email } : null,
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
