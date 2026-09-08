"use client";

import { useEffect, useState } from "react";
import type { MediaItem, PaginatedMedia } from "@/src/lib/tmdb/types";
import { MediaCard } from "./media-card";
import { Pagination } from "./pagination";

type JikanAnime = {
  mal_id: number;
  url: string;
  title: string;
  title_japanese?: string | null;
  synopsis?: string | null;
  images?: { jpg?: { large_image_url?: string | null; image_url?: string | null } };
  aired?: { from?: string | null };
  score?: number | null;
  scored_by?: number | null;
  members?: number | null;
  genres?: Array<{ mal_id: number }>;
  rank?: number | null;
};

type JikanResponse = {
  data: JikanAnime[];
  pagination: { current_page: number; last_visible_page: number; items: { total: number } };
};

function mapAnime(anime: JikanAnime): MediaItem {
  const releaseDate = anime.aired?.from ?? null;
  const parsedYear = releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : NaN;
  return {
    id: anime.mal_id,
    mediaType: "tv",
    source: "jikan",
    externalUrl: anime.url,
    posterUrl: anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url ?? null,
    adult: false,
    title: anime.title,
    originalTitle: anime.title_japanese ?? undefined,
    overview: anime.synopsis ?? "",
    posterPath: null,
    backdropPath: null,
    releaseDate,
    year: Number.isFinite(parsedYear) ? parsedYear : null,
    voteAverage: anime.score ?? 0,
    voteCount: anime.scored_by ?? 0,
    popularity: anime.members ?? 0,
    genreIds: anime.genres?.map((genre) => genre.mal_id) ?? [],
    rankingPosition: anime.rank ?? undefined,
  };
}

export function JikanAnimeCatalog({ page }: { page: number }) {
  const [data, setData] = useState<PaginatedMedia | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    // Keep the request to Jikan's canonical endpoint. Page one needs no
    // parameters, and later pages only require the page number.
    const endpoint =
      page === 1
        ? "https://api.jikan.moe/v4/top/anime"
        : `https://api.jikan.moe/v4/top/anime?page=${page}`;

    fetch(endpoint, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Jikan respondeu ${response.status}`);
        return response.json() as Promise<JikanResponse>;
      })
      .then((response) => {
        setData({
          page: response.pagination.current_page,
          results: response.data.map(mapAnime),
          totalPages: response.pagination.last_visible_page,
          totalResults: response.pagination.items.total,
        });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        console.warn("Não foi possível carregar animes da Jikan no navegador", { cause });
        setError(true);
      });

    return () => controller.abort();
  }, [page]);

  if (error) {
    return <p className="section-empty">Não foi possível carregar o catálogo de animes. Tente novamente em instantes.</p>;
  }

  if (!data) {
    return <p className="section-empty">Carregando animes...</p>;
  }

  return (
    <>
      <div className="catalog-grid">
        {data.results.map((item) => <MediaCard item={item} key={`jikan-${item.id}`} />)}
      </div>
      <Pagination currentPage={data.page} totalPages={data.totalPages} />
    </>
  );
}
