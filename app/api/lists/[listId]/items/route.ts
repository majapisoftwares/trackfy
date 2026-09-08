import type { NextRequest } from "next/server";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { addToCustomList } from "@/src/lib/tracking/custom-lists";
import { getTrackingSession } from "@/src/lib/tracking/session";
import { isTrackingMediaType } from "@/src/lib/tracking/types";

export const runtime = "nodejs";
type Context = { params: Promise<{ listId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const { listId } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const rawMediaType = body?.mediaType;
  const mediaId = Number(body?.mediaId);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const posterUrl = body?.posterUrl === null || typeof body?.posterUrl === "string" ? body.posterUrl ?? null : null;
  if (!isTrackingMediaType(String(rawMediaType)) || !Number.isInteger(mediaId) || mediaId < 1 || !title || title.length > 300) {
    return apiError("INVALID_ITEM", "O conteúdo informado é inválido.", 400);
  }
  const mediaType = String(rawMediaType) as "movie" | "tv";
  const session = getTrackingSession(request);
  const item = await addToCustomList(session.ownerId, listId, { mediaType, mediaId, title, posterUrl });
  if (!item) return apiError("LIST_NOT_FOUND", "Lista não encontrada.", 404);
  return jsonNoStore({ item });
}
