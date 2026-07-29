import type { NextRequest, NextResponse } from "next/server";
import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  findAuthUserBySessionToken,
  type AuthUser,
  type CreatedAuthSession,
} from "./repository";

export const AUTH_COOKIE_NAME = "trackfy_auth";

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function getAuthenticatedUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  const token = getAuthToken(request);
  return token ? findAuthUserBySessionToken(token) : null;
}

export function attachAuthSession(
  response: NextResponse,
  session: CreatedAuthSession,
): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    expires: session.expiresAt,
  });
  return response;
}

export function clearAuthSession(response: NextResponse): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
