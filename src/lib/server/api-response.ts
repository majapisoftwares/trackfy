import { NextResponse } from "next/server";

export function jsonNoStore(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return jsonNoStore({ error: message, code }, status);
}
