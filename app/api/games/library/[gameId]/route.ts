import type { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/auth/session";
import { deleteUserGame, findUserGame, saveUserGame } from "@/src/lib/games/repository";
import { parseUserGamePatch } from "@/src/lib/games/validation";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { logger } from "@/src/lib/server/logger";

export const runtime = "nodejs";
type Context = { params: Promise<{ gameId: string }> };
async function gameId(context: Context) { const id = Number((await context.params).gameId); return Number.isInteger(id) && id > 0 ? id : null; }
async function userFor(request: NextRequest) { return getAuthenticatedUser(request); }

export async function GET(request: NextRequest, context: Context) {
  const id = await gameId(context); const user = await userFor(request);
  if (!id) return apiError("INVALID_GAME", "O jogo informado é inválido.", 400);
  if (!user) return apiError("UNAUTHORIZED", "Entre para acompanhar jogos.", 401);
  try { return jsonNoStore({ item: await findUserGame(user.ownerId, id) }); }
  catch (error) { logger.error(error, "USER_GAME_FETCH_ERROR"); return apiError("GAMES_LIBRARY_UNAVAILABLE", "Não foi possível carregar seu progresso.", 503); }
}

export async function PATCH(request: NextRequest, context: Context) {
  const originError = requireSameOrigin(request); if (originError) return originError;
  const id = await gameId(context); const user = await userFor(request);
  if (!id) return apiError("INVALID_GAME", "O jogo informado é inválido.", 400);
  if (!user) return apiError("UNAUTHORIZED", "Entre para acompanhar jogos.", 401);
  let body: unknown; try { body = await request.json(); } catch { return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400); }
  const patch = parseUserGamePatch(body);
  if (!patch) return apiError("INVALID_GAME_DATA", "Os dados do jogo são inválidos.", 400);
  try { return jsonNoStore({ item: await saveUserGame(user.ownerId, id, patch) }); }
  catch (error) { logger.error(error, "USER_GAME_UPDATE_ERROR"); return apiError("GAMES_LIBRARY_UNAVAILABLE", "Não foi possível salvar seu progresso.", 503); }
}

export async function DELETE(request: NextRequest, context: Context) {
  const originError = requireSameOrigin(request); if (originError) return originError;
  const id = await gameId(context); const user = await userFor(request);
  if (!id) return apiError("INVALID_GAME", "O jogo informado é inválido.", 400);
  if (!user) return apiError("UNAUTHORIZED", "Entre para acompanhar jogos.", 401);
  try { return jsonNoStore({ deleted: await deleteUserGame(user.ownerId, id) }); }
  catch (error) { logger.error(error, "USER_GAME_DELETE_ERROR"); return apiError("GAMES_LIBRARY_UNAVAILABLE", "Não foi possível remover o jogo.", 503); }
}
