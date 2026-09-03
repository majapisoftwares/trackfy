import { NextResponse } from "next/server";
import { getEpisodePageData } from "@/src/lib/tmdb/episode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showId = Number(searchParams.get("showId"));
  const seasonNumber = Number(searchParams.get("seasonNumber"));
  const episodeNumber = Number(searchParams.get("episodeNumber"));

  if (!showId || !seasonNumber || !episodeNumber) {
    return NextResponse.json(
      { error: "Parâmetros showId, seasonNumber e episodeNumber são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const episode = await getEpisodePageData(showId, seasonNumber, episodeNumber);
    if (!episode) {
      return NextResponse.json(
        { error: "Episódio não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json(episode);
  } catch (error) {
    console.error("Erro ao buscar detalhes do episódio:", error);
    return NextResponse.json(
      { error: "Falha ao carregar dados do episódio." },
      { status: 500 },
    );
  }
}

