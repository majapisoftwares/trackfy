import { NextRequest, NextResponse } from "next/server";
import { getSearchResults } from "@/src/lib/tmdb/endpoints";
import { enforceRateLimit } from "@/src/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    scope: "tmdb-search",
    limit: 30,
    windowSeconds: 60,
  });
  if (rateLimitError) return rateLimitError;

  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const pageValue = request.nextUrl.searchParams.get("page") ?? "1";
  const page = Number.parseInt(pageValue, 10);

  if (!query) {
    return NextResponse.json(
      { error: "Informe um texto para pesquisar." },
      { status: 400 },
    );
  }
  if (query.length > 100) {
    return NextResponse.json(
      { error: "O texto da pesquisa é muito longo." },
      { status: 400 },
    );
  }
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    return NextResponse.json(
      { error: "A página informada é inválida." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getSearchResults(query, page));
  } catch (error) {
    console.error("Erro na pesquisa interna do catálogo", {
      cause: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return NextResponse.json(
      { error: "Não foi possível realizar a pesquisa." },
      { status: 502 },
    );
  }
}
