import { MongoServerError } from "mongodb";
import type { NextRequest } from "next/server";
import { hashPassword, verifyPassword } from "@/src/lib/auth/password";
import { getAuthenticatedUser } from "@/src/lib/auth/session";
import { findAuthUserByEmail, updateAuthUser } from "@/src/lib/auth/repository";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, normalizeEmail } from "@/src/lib/auth/validation";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { logger } from "@/src/lib/server/logger";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NICKNAME_LENGTH = 40;

type ProfileBody = {
  nickname?: unknown;
  email?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
};

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  let body: ProfileBody;
  try {
    body = await request.json() as ProfileBody;
  } catch {
    return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError("INVALID_BODY", "Envie um corpo JSON válido.", 400);
  }

  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("UNAUTHORIZED", "Faça login para continuar.", 401);

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;
  const email = typeof body.email === "string" ? body.email.trim() : undefined;
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : undefined;
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

  if (nickname !== undefined && (!nickname || nickname.length > MAX_NICKNAME_LENGTH)) {
    return apiError("INVALID_NICKNAME", "O apelido deve ter entre 1 e 40 caracteres.", 400);
  }
  if (email !== undefined && (!EMAIL_PATTERN.test(normalizeEmail(email)) || email.length > 254)) {
    return apiError("INVALID_EMAIL", "Informe um e-mail válido.", 400);
  }
  if (newPassword !== undefined && (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH)) {
    return apiError("INVALID_PASSWORD", `A nova senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`, 400);
  }
  if (nickname === undefined && email === undefined && newPassword === undefined) {
    return apiError("NO_CHANGES", "Informe ao menos um dado para atualizar.", 400);
  }

  try {
    const requiresPassword = email !== undefined || newPassword !== undefined;
    const userWithPassword = requiresPassword ? await findAuthUserByEmail(normalizeEmail(user.email)) : null;
    if (requiresPassword && (!userWithPassword || !(await verifyPassword(currentPassword, userWithPassword.passwordHash)))) {
      return apiError("INVALID_CURRENT_PASSWORD", "A senha atual está incorreta.", 401);
    }

    const updated = await updateAuthUser(user.id, {
      nickname,
      ...(email !== undefined ? { email, normalizedEmail: normalizeEmail(email) } : {}),
      ...(newPassword !== undefined ? { passwordHash: await hashPassword(newPassword) } : {}),
    });
    if (!updated) return apiError("USER_NOT_FOUND", "Usuário não encontrado.", 404);
    return jsonNoStore({ user: { id: updated.id, email: updated.email, nickname: updated.nickname } });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11_000) {
      return apiError("EMAIL_EXISTS", "Este e-mail já está em uso.", 409);
    }
    logger.error(error, "AUTH_PROFILE_UPDATE_ERROR");
    return apiError("AUTH_UNAVAILABLE", "Não foi possível salvar suas configurações.", 503);
  }
}
