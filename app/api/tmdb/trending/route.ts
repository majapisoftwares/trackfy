import { NextRequest, NextResponse } from "next/server";
import { getTrendingAllPage } from "@/src/lib/tmdb/endpoints";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "tmdb-trending",
    limit: 60,
    windowSeconds: 60,
  });
  if (rateLimitError) return rateLimitError;

  const pageValue = request.nextUrl.searchParams.get("page") ?? "1";
  const page = Number.parseInt(pageValue, 10);

  if (!Number.isInteger(page) || page < 1 || page > 500) {
    return NextResponse.json(
      { error: "A página informada é inválida." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getTrendingAllPage(page));
  } catch (error) {
    console.error("Erro ao carregar tendências do catálogo", {
      cause: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return NextResponse.json(
      { error: "Não foi possível carregar as produções em alta." },
      { status: 502 },
    );
  }
}
