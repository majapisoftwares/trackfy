import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/src/lib/tmdb/endpoints";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";
import type { MediaType } from "@/src/lib/tmdb/types";

function isMediaType(value: string | null): value is MediaType {
  return value === "movie" || value === "tv";
}

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "tmdb-recommendations",
    limit: 30,
    windowSeconds: 60,
  });
  if (rateLimitError) return rateLimitError;

  const mediaType = request.nextUrl.searchParams.get("mediaType");
  const mediaId = Number.parseInt(
    request.nextUrl.searchParams.get("mediaId") ?? "",
    10,
  );

  if (!isMediaType(mediaType) || !Number.isInteger(mediaId) || mediaId < 1) {
    return NextResponse.json(
      { error: "Parâmetros de recomendação inválidos." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getRecommendations(mediaType, mediaId));
  } catch (error) {
    console.error("Erro nas recomendações internas do catálogo", {
      cause: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return NextResponse.json(
      { error: "Não foi possível carregar as recomendações." },
      { status: 502 },
    );
  }
}
