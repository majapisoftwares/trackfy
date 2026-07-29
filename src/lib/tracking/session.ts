import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const TRACKING_COOKIE_NAME = "trackfy_session";
const TRACKING_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TrackingSession = {
  ownerId: string;
  isNew: boolean;
};

export function isTrackingOwnerId(value: string | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function getTrackingOwnerId(request: NextRequest): string | null {
  const current = request.cookies.get(TRACKING_COOKIE_NAME)?.value;
  return isTrackingOwnerId(current) ? current : null;
}

export function getTrackingSession(request: NextRequest): TrackingSession {
  const current = getTrackingOwnerId(request);

  if (current) {
    return { ownerId: current, isNew: false };
  }

  return { ownerId: randomUUID(), isNew: true };
}

export function attachTrackingOwner(
  response: NextResponse,
  ownerId: string,
): NextResponse {
  response.cookies.set({
    name: TRACKING_COOKIE_NAME,
    value: ownerId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRACKING_COOKIE_MAX_AGE,
  });
  return response;
}

export function attachTrackingSession(
  response: NextResponse,
  session: TrackingSession,
): NextResponse {
  if (session.isNew) {
    attachTrackingOwner(response, session.ownerId);
  }

  return response;
}
