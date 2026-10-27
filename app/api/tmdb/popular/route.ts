import { NextRequest, NextResponse } from "next/server";
import {
  getPopularMoviesPage,
  getPopularTVShowsPage,
  getPopularAllPage,
  getTrendingAllPage,
} from "@/src/lib/tmdb/endpoints";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "tmdb-popular",
    limit: 60,
    windowSeconds: 60,
  });
  if (rateLimitError) return rateLimitError;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { page, filters } = parseCatalogSearchParams(searchParams);

  try {
    const data =
      filters.mediaType === "movie"
        ? await getPopularMoviesPage(page, filters)
        : filters.mediaType === "tv"
          ? await getPopularTVShowsPage(page, filters)
          : filters.sort || filters.streamingProviderId
            ? await getPopularAllPage(page, filters)
            : await getTrendingAllPage(page, filters);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao carregar catálogo popular", {
      cause: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return NextResponse.json(
      { error: "Não foi possível carregar o catálogo." },
      { status: 502 },
    );
  }
}

