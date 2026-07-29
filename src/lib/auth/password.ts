import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;

function derivePassword(
  password: string,
  salt: string,
  keyLength: number,
  cost: number,
  blockSize: number,
  parallelization: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      keyLength,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await derivePassword(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
  );

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt,
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedPassword: string,
): Promise<boolean> {
  const [algorithm, rawCost, rawBlockSize, rawParallelization, salt, encodedKey] =
    encodedPassword.split("$");
  const cost = Number(rawCost);
  const blockSize = Number(rawBlockSize);
  const parallelization = Number(rawParallelization);

  if (
    algorithm !== "scrypt" ||
    !salt ||
    !encodedKey ||
    !Number.isInteger(cost) ||
    !Number.isInteger(blockSize) ||
    !Number.isInteger(parallelization) ||
    cost < 2 ||
    cost > SCRYPT_COST ||
    blockSize < 1 ||
    blockSize > SCRYPT_BLOCK_SIZE ||
    parallelization < 1 ||
    parallelization > SCRYPT_PARALLELIZATION
  ) {
    return false;
  }

  let expectedKey: Buffer;
  try {
    expectedKey = Buffer.from(encodedKey, "base64url");
  } catch {
    return false;
  }

  if (expectedKey.length !== KEY_LENGTH) {
    return false;
  }

  const actualKey = await derivePassword(
    password,
    salt,
    expectedKey.length,
    cost,
    blockSize,
    parallelization,
  );

  return timingSafeEqual(expectedKey, actualKey);
}
