export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Credentials = {
  email: string;
  normalizedEmail: string;
  password: string;
};

export type Registration = Credentials & {
  termsAccepted: true;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("en-US");
}

export function parseCredentials(body: unknown): Credentials | null {
  if (!isObject(body)) return null;

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const normalizedEmail = normalizeEmail(email);

  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(normalizedEmail) ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return null;
  }

  return { email, normalizedEmail, password };
}

export function parseRegistration(body: unknown): Registration | null {
  const credentials = parseCredentials(body);

  if (
    !credentials ||
    !isObject(body) ||
    body.termsAccepted !== true
  ) {
    return null;
  }

  return { ...credentials, termsAccepted: true };
}
