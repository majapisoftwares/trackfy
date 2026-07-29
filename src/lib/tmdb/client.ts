const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type QueryValue = string | number | boolean | undefined;

export type TMDBRequestOptions = {
  query?: Record<string, QueryValue>;
  cache?: RequestCache;
  revalidate?: number;
};

export class TMDBError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "TMDBError";
  }
}

function getAccessToken(): string {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new TMDBError(
      "A integração com o catálogo não está configurada no servidor.",
    );
  }
  return token;
}

export async function tmdbFetch<T>(
  endpoint: string,
  options: TMDBRequestOptions = {},
): Promise<T> {
  const query = new URLSearchParams({ language: "pt-BR" });
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${query}`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      Accept: "application/json",
    },
    cache: options.cache,
    next:
      options.revalidate === undefined
        ? undefined
        : { revalidate: options.revalidate },
  });

  if (!response.ok) {
    console.error("Falha na API do TMDB", {
      endpoint,
      status: response.status,
    });
    throw new TMDBError(
      "Não foi possível carregar o catálogo neste momento.",
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TMDBError("O catálogo retornou uma resposta inválida.");
  }
}
