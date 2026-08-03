import type { NextRequest } from "next/server";
import { apiError } from "./api-response";

/** Rejects cross-origin browser requests that could carry session cookies. */
export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return apiError("INVALID_ORIGIN", "Origem da requisição não permitida.", 403);
  }

  return null;
}
