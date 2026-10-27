import type { NextRequest } from "next/server";
import { parseImdbImport } from "@/src/lib/imdb/import";
import { getAuthenticatedUser } from "@/src/lib/auth/session";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { findMediaByImdbId } from "@/src/lib/tmdb/endpoints";
import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { requireSameOrigin } from "@/src/lib/server/csrf";
import { logger } from "@/src/lib/server/logger";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";
import { findTrackingEntry, updateTrackingEntry } from "@/src/lib/tracking/repository";
import type { TrackingMediaType } from "@/src/lib/tracking/types";

export const runtime = "nodejs";

const MAX_IMPORT_BODY_BYTES = 2 * 1024 * 1024;
const IMPORT_CONCURRENCY = 8;

type ResolvedItem = {
  mediaType: TrackingMediaType;
  tmdbId: number;
  title: string;
  posterUrl: string | null;
};

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

async function resolveItem(
  item: ReturnType<typeof parseImdbImport>["items"][number],
): Promise<ResolvedItem | null> {
  try {
    const media = await findMediaByImdbId(item.imdbId, item.mediaType);
    if (!media) return null;

    return {
      mediaType: media.mediaType,
      tmdbId: media.id,
      title: media.title,
      posterUrl: getTMDBImageUrl(media.posterPath),
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Faça login para importar sua lista.", 401);

  const rateLimitError = enforceRateLimit(request, {
    scope: "imdb-import",
    identifier: user.id,
    limit: 2,
    windowSeconds: 10 * 60,
  });
  if (rateLimitError) return rateLimitError;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_BODY_BYTES) {
    return apiError("IMPORT_TOO_LARGE", "O arquivo de importação excede o limite de 2 MB.", 413);
  }

  let csv: string;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_IMPORT_BODY_BYTES) {
      return apiError("IMPORT_TOO_LARGE", "O arquivo de importação excede o limite de 2 MB.", 413);
    }
    csv = rawBody;
  } catch {
    return apiError("INVALID_IMPORT", "O arquivo selecionado não contém um CSV válido.", 400);
  }

  if (!csv.trim()) {
    return apiError("INVALID_IMPORT", "Envie um arquivo CSV exportado pelo IMDb.", 400);
  }

  const parsed = parseImdbImport(csv);
  if (!parsed.validFormat) {
    return apiError("UNSUPPORTED_IMPORT", "Não reconhecemos este CSV. Exporte uma lista ou Watchlist diretamente pelo IMDb.", 400);
  }
  if (parsed.overLimit) {
    return apiError("IMPORT_LIMIT", "A lista possui mais de 1.000 itens. Divida-a em arquivos menores para importar.", 413);
  }
  if (parsed.items.length === 0) {
    return apiError("UNSUPPORTED_IMPORT", "Não encontramos títulos compatíveis neste CSV do IMDb.", 400);
  }

  try {
    const resolved = await mapWithConcurrency(parsed.items, IMPORT_CONCURRENCY, resolveItem);
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
        inList: existing?.watched ? false : true,
        archived: existing?.archived ?? false,
        watched: existing?.watched ?? false,
        rating: existing?.rating ?? null,
      });
    }

    return jsonNoStore({
      imported,
      duplicates,
      notFound: parsed.items.length - found.length,
      invalid: parsed.invalid,
    });
  } catch (error) {
    logger.error(error, "IMDB_IMPORT_ERROR");
    return apiError("IMPORT_UNAVAILABLE", "Não foi possível concluir a importação agora. Tente novamente.", 503);
  }
}
