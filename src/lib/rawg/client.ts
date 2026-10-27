import type { GameFilters } from "./types";

const RAWG_BASE_URL = "https://api.rawg.io/api";
const REQUEST_TIMEOUT_MS = 8_000;

export class RawgError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "RawgError";
  }
}

function getApiKey(): string {
  const key = process.env.RAWG_API_KEY?.trim();
  if (!key) {
    throw new RawgError("A integração com jogos não está configurada no servidor.");
  }
  return key;
}

export async function rawgFetch<T>(
  endpoint: string,
  query: GameFilters & Record<string, string | number | undefined> = {},
  revalidate = 60 * 30,
): Promise<T> {
  const params = new URLSearchParams({ key: getApiKey() });
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(`${RAWG_BASE_URL}${endpoint}?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new RawgError("A consulta de jogos demorou mais que o esperado.");
    }
    throw new RawgError("Não foi possível conectar ao catálogo de jogos.");
  }

  if (!response.ok) {
    throw new RawgError("Não foi possível carregar o catálogo de jogos neste momento.", response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new RawgError("O catálogo de jogos retornou uma resposta inválida.");
  }
}
