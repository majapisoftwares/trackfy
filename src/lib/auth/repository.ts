import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  MongoServerError,
  ObjectId,
  type Collection,
} from "mongodb";
import { getDatabase } from "@/src/lib/server/mongodb";
import { hashPassword } from "./password";

const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type UserDocument = {
  email: string;
  normalizedEmail: string;
  nickname?: string;
  passwordHash: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type AuthSessionDocument = {
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
};

export type AuthUser = {
  id: string;
  email: string;
  nickname: string | null;
  ownerId: string;
  createdAt: string;
};

export type CreatedAuthSession = {
  token: string;
  expiresAt: Date;
};

declare global {
  var _trackfyAuthIndexesPromise: Promise<unknown> | undefined;
}

async function getAuthCollections(): Promise<{
  users: Collection<UserDocument>;
  sessions: Collection<AuthSessionDocument>;
}> {
  const database = await getDatabase();
  const users = database.collection<UserDocument>("users");
  const sessions = database.collection<AuthSessionDocument>("auth_sessions");

  if (!global._trackfyAuthIndexesPromise) {
    global._trackfyAuthIndexesPromise = Promise.all([
      users.createIndex({ normalizedEmail: 1 }, { unique: true }),
      users.createIndex({ ownerId: 1 }, { unique: true }),
      sessions.createIndex({ tokenHash: 1 }, { unique: true }),
      sessions.createIndex({ userId: 1 }),
      sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
  }

  await global._trackfyAuthIndexesPromise;
  return { users, sessions };
}

function toAuthUser(
  document: UserDocument & { _id: ObjectId },
): AuthUser {
  return {
    id: document._id.toHexString(),
    email: document.email,
    nickname: document.nickname?.trim() || null,
    ownerId: document.ownerId,
    createdAt: document.createdAt.toISOString(),
  };
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createAuthUser(
  email: string,
  normalizedEmail: string,
  password: string,
): Promise<AuthUser | null> {
  const { users } = await getAuthCollections();
  const now = new Date();
  const document: UserDocument = {
    email,
    normalizedEmail,
    passwordHash: await hashPassword(password),
    ownerId: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await users.insertOne(document);
    return toAuthUser({ ...document, _id: result.insertedId });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11_000) {
      return null;
    }

    throw error;
  }
}

export async function findAuthUserByEmail(
  normalizedEmail: string,
): Promise<(AuthUser & { passwordHash: string }) | null> {
  const { users } = await getAuthCollections();
  const document = await users.findOne({ normalizedEmail });

  return document
    ? { ...toAuthUser(document), passwordHash: document.passwordHash }
    : null;
}

export async function createAuthSession(
  userId: string,
): Promise<CreatedAuthSession> {
  const { sessions } = await getAuthCollections();
  const token = randomBytes(32).toString("base64url");
  const createdAt = new Date();
  const expiresAt = new Date(
    createdAt.getTime() + AUTH_SESSION_MAX_AGE_SECONDS * 1_000,
  );

  await sessions.insertOne({
    tokenHash: hashSessionToken(token),
    userId: new ObjectId(userId),
    createdAt,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function findAuthUserBySessionToken(
  token: string,
): Promise<AuthUser | null> {
  const { users, sessions } = await getAuthCollections();
  const session = await sessions.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  const user = await users.findOne({ _id: session.userId });
  return user ? toAuthUser(user) : null;
}

export async function deleteAuthSession(token: string): Promise<void> {
  const { sessions } = await getAuthCollections();
  await sessions.deleteOne({ tokenHash: hashSessionToken(token) });
}

export async function updateAuthUser(
  userId: string,
  values: { email?: string; normalizedEmail?: string; nickname?: string; passwordHash?: string },
): Promise<AuthUser | null> {
  const { users } = await getAuthCollections();
  const update: Partial<UserDocument> = { updatedAt: new Date() };
  if (values.email !== undefined) update.email = values.email;
  if (values.normalizedEmail !== undefined) update.normalizedEmail = values.normalizedEmail;
  if (values.nickname !== undefined) update.nickname = values.nickname;
  if (values.passwordHash !== undefined) update.passwordHash = values.passwordHash;

  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: update },
    { returnDocument: "after" },
  );
  return result ? toAuthUser(result) : null;
}

export { AUTH_SESSION_MAX_AGE_SECONDS };
