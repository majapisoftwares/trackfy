import type { NextRequest } from "next/server";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { getTrackingSession } from "@/src/lib/tracking/session";
import { createCustomList, listCustomLists } from "@/src/lib/tracking/custom-lists";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = getTrackingSession(request);
  return jsonNoStore({ items: await listCustomLists(session.ownerId) });
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400); }
  const name = typeof body === "object" && body !== null && "name" in body
    ? String(body.name).trim() : "";
  if (!name || name.length > 60) return apiError("INVALID_NAME", "Informe um nome entre 1 e 60 caracteres.", 400);
  const session = getTrackingSession(request);
  const item = await createCustomList(session.ownerId, name);
  return jsonNoStore({ item }, 201);
}
