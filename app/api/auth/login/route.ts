import type { NextRequest } from "next/server";
import { establishUserSession } from "@/src/lib/auth/establish-session";
import { verifyPassword } from "@/src/lib/auth/password";
import { findAuthUserByEmail } from "@/src/lib/auth/repository";
import { parseCredentials } from "@/src/lib/auth/validation";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { logger } from "@/src/lib/server/logger";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";

export const runtime = "nodejs";

const DUMMY_PASSWORD_HASH = "scrypt$16384$8$1$trackfy-login-dummy-salt$KVWEkVY1Bt1keidpI_jbFKdJ5xbUkpCNrZ_Ng0cm7RwcT1QugUBBCHNgk07I29FpgEjs7HWwQN1lQuPAwpv8xQ";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ipLimit = enforceRateLimit(request, {
    scope: "auth-login-ip",
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (ipLimit) return ipLimit;

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

  const accountLimit = enforceRateLimit(request, {
    scope: "auth-login-account",
    identifier: credentials.normalizedEmail,
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (accountLimit) return accountLimit;

  try {
    const user = await findAuthUserByEmail(credentials.normalizedEmail);
    const passwordMatches = await verifyPassword(
      credentials.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      return apiError(
        "INVALID_CREDENTIALS",
        "E-mail ou senha inválidos.",
        401,
      );
    }

    const response = jsonNoStore({
      user: { id: user.id, email: user.email, nickname: user.nickname },
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
