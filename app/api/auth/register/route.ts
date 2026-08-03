import type { NextRequest } from "next/server";
import { establishUserSession } from "@/src/lib/auth/establish-session";
import { createAuthUser } from "@/src/lib/auth/repository";
import { parseRegistration } from "@/src/lib/auth/validation";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { logger } from "@/src/lib/server/logger";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-register",
    limit: 3,
    windowSeconds: 60 * 60,
  });
  if (rateLimitError) return rateLimitError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400);
  }

  const registration = parseRegistration(body);
  if (!registration) {
    return apiError(
      "INVALID_REGISTRATION",
      "Informe um e-mail válido, uma senha de pelo menos 8 caracteres e aceite os termos.",
      400,
    );
  }

  try {
    const user = await createAuthUser(
      registration.email,
      registration.normalizedEmail,
      registration.password,
    );

    if (!user) {
      return apiError(
        "EMAIL_ALREADY_REGISTERED",
        "Já existe uma conta com este e-mail.",
        409,
      );
    }

    const response = jsonNoStore(
      { user: { id: user.id, email: user.email } },
      201,
    );
    return establishUserSession(request, response, user);
  } catch (error) {
    logger.error(error, "AUTH_REGISTER_ERROR");
    return apiError(
      "AUTH_UNAVAILABLE",
      "Não foi possível criar sua conta agora.",
      503,
    );
  }
}
