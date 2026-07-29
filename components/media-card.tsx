"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { Rating } from "./rating";

export function MediaCard({ item }: { item: MediaItem }) {
  const [failed, setFailed] = useState(false);
  const posterUrl = getTMDBImageUrl(item.posterPath, "w500");
  const href =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/series/${item.id}`;
  const typeLabel = item.mediaType === "movie" ? "Filme" : "Série";

  return (
    <article className="media-card" data-ranking-position={item.rankingPosition}>
      <Link className="media-card-link" href={href} aria-label={`Ver detalhes de ${item.title}`}>
        <div className="poster-frame">
          {failed || !posterUrl ? (
            <span className="poster-fallback">Imagem indisponível</span>
          ) : (
            <Image
              className="poster-image"
              src={posterUrl}
              alt={`Pôster de ${item.title}`}
              fill
              sizes="(max-width: 640px) 180px, (max-width: 900px) 220px, 240px"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <div className="media-meta">
          <div className="media-text">
            <h3 className="media-title">{item.title}</h3>
            <p className="media-year">
              {item.year ?? "Data indisponível"} · {typeLabel}
            </p>
          </div>
          <Rating value={item.voteAverage} />
        </div>
      </Link>
    </article>
  );
}
