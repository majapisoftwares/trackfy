import type { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/auth/session";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { getMovieDetails, getTVShowDetails } from "@/src/lib/tmdb/endpoints";
import { parseTraktImport } from "@/src/lib/trakt/import";
import {
  findTrackingEntry,
  updateTrackedEpisodes,
  updateTrackingEntry,
} from "@/src/lib/tracking/repository";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { logger } from "@/src/lib/server/logger";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";

export const runtime = "nodejs";
const MAX_IMPORT_BODY_BYTES = 2 * 1024 * 1024;
const IMPORT_CONCURRENCY = 8;

type ResolvedItem = {
  mediaType: "movie" | "tv";
  tmdbId: number;
  watched: boolean;
  inList: boolean;
  rating: number | null;
  watchedEpisodes: { seasonNumber: number; episodeNumber: number }[];
  title: string;
  posterUrl: string | null;
};

async function resolveItem(item: ReturnType<typeof parseTraktImport>["items"][number]): Promise<ResolvedItem | null> {
  try {
    if (item.mediaType === "movie") {
      const details = await getMovieDetails(item.tmdbId);
      const title = details.title?.trim();
      if (!title) return null;
      return {
        ...item,
        title,
        posterUrl: getTMDBImageUrl(details.poster_path),
      };
    }

    const details = await getTVShowDetails(item.tmdbId);
    const title = details.name?.trim();
    if (!title) return null;
    return {
      ...item,
      title,
      posterUrl: getTMDBImageUrl(details.poster_path),
    };
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, Result>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<Result>,
): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await mapper(items[index]);
      }
    }),
  );

  return results;
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Faça login para importar seu histórico.", 401);

  const rateLimitError = enforceRateLimit(request, {
    scope: "trakt-import",
    identifier: user.id,
    limit: 2,
    windowSeconds: 10 * 60,
  });
  if (rateLimitError) return rateLimitError;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_BODY_BYTES) {
    return apiError("IMPORT_TOO_LARGE", "O arquivo de importação excede o limite de 2 MB.", 413);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_IMPORT_BODY_BYTES) {
      return apiError("IMPORT_TOO_LARGE", "O arquivo de importação excede o limite de 2 MB.", 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return apiError("INVALID_IMPORT", "O arquivo selecionado não contém um JSON válido.", 400);
  }

  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? body as { data?: unknown; sourceName?: unknown }
    : null;
  const data = payload && "data" in payload ? payload.data : body;
  const sourceName = typeof payload?.sourceName === "string" ? payload.sourceName : "";
  const parsed = parseTraktImport(
    Array.isArray(data) && sourceName.toLowerCase().includes("watchlist")
      ? { watchlist: data }
      : data,
    sourceName,
  );
  if (parsed.overLimit) {
    return apiError("IMPORT_LIMIT", "O backup possui mais de 1.000 itens. Divida-o em arquivos menores para importar.", 413);
  }
  if (parsed.items.length === 0) {
    return apiError("UNSUPPORTED_IMPORT", "Não encontramos filmes, séries ou episódios compatíveis neste JSON do Trakt.", 400);
  }

  try {
    const resolved = await mapWithConcurrency(
      parsed.items,
      IMPORT_CONCURRENCY,
      resolveItem,
    );
    const found = resolved.filter((item): item is ResolvedItem => item !== null);
    let imported = 0;
    let duplicates = 0;

    for (const item of found) {
      const existing = await findTrackingEntry(user.ownerId, item.mediaType, item.tmdbId);
      if (existing) duplicates += 1;
      else imported += 1;

      await updateTrackingEntry(user.ownerId, item.mediaType, item.tmdbId, {
        title: item.title,
        posterUrl: item.posterUrl,
        inList: existing?.inList || item.inList,
        archived: existing?.archived || item.watched,
        watched: existing?.watched || item.watched,
        rating: existing?.rating ?? item.rating,
      });

      if (item.mediaType === "tv" && item.watchedEpisodes.length > 0) {
        await updateTrackedEpisodes(user.ownerId, item.tmdbId, {
          title: item.title,
          posterUrl: item.posterUrl,
          episodes: item.watchedEpisodes,
          watched: true,
          target: "watched",
        });
      }
    }

    return jsonNoStore({
      imported,
      duplicates,
      notFound: parsed.items.length - found.length,
      invalid: parsed.invalid,
    });
  } catch (error) {
    logger.error(error, "TRAKT_IMPORT_ERROR");
    return apiError("IMPORT_UNAVAILABLE", "Não foi possível concluir a importação agora. Tente novamente.", 503);
  }
}
