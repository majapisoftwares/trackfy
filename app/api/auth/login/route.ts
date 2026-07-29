import type { NextRequest } from "next/server";
import { establishUserSession } from "@/src/lib/auth/establish-session";
import { verifyPassword } from "@/src/lib/auth/password";
import { findAuthUserByEmail } from "@/src/lib/auth/repository";
import { parseCredentials } from "@/src/lib/auth/validation";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400);
  }

  const credentials = parseCredentials(body);
  if (!credentials) {
    return apiError(
      "INVALID_CREDENTIALS",
      "E-mail ou senha inválidos.",
      401,
    );
  }

  try {
    const user = await findAuthUserByEmail(credentials.normalizedEmail);
    const passwordMatches =
      user && (await verifyPassword(credentials.password, user.passwordHash));

    if (!user || !passwordMatches) {
      return apiError(
        "INVALID_CREDENTIALS",
        "E-mail ou senha inválidos.",
        401,
      );
    }

    const response = jsonNoStore({
      user: { id: user.id, email: user.email },
    });
    return establishUserSession(request, response, user);
  } catch (error) {
    logger.error(error, "AUTH_LOGIN_ERROR");
    return apiError(
      "AUTH_UNAVAILABLE",
      "Não foi possível entrar agora.",
      503,
    );
  }
}
