import type { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/auth/session";
import { listUserGames } from "@/src/lib/games/repository";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("UNAUTHORIZED", "Entre para acessar sua biblioteca de jogos.", 401);
  try { return jsonNoStore({ items: await listUserGames(user.ownerId) }); }
  catch (error) { logger.error(error, "USER_GAMES_LIST_ERROR"); return apiError("GAMES_LIBRARY_UNAVAILABLE", "Não foi possível carregar sua biblioteca.", 503); }
}
