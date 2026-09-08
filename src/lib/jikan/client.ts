const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

export class JikanError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "JikanError";
  }
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export async function jikanFetch<T>(endpoint: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }

  const url = `${JIKAN_BASE_URL}${endpoint}?${params}`;
  let response: Response | undefined;
  let networkCause: string | undefined;

  // Jikan is a shared public API and can temporarily answer 429. Retrying a
  // small number of times keeps the page usable without amplifying the load.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 * 60 },
      });
    } catch (error) {
      networkCause = error instanceof Error ? error.message : "Erro desconhecido";
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }
    }

    if (response?.ok) return response.json() as Promise<T>;

    if (!response || !RETRYABLE_STATUS_CODES.has(response.status) || attempt === 2) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }

  // This can be expected while the public API is rate-limited or unavailable.
  // Use a warning so development mode does not surface it as an application error.
  console.warn("Catálogo Jikan indisponível", {
    endpoint,
    status: response?.status,
    cause: networkCause,
  });
  throw new JikanError("Não foi possível carregar os animes neste momento.", response?.status);
}
