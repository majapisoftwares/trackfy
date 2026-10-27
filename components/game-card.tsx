"use client";

/* RAWG image URLs stay browser-loaded to preserve the project's no-optimizer policy. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import type { GameItem } from "@/src/lib/rawg/types";

function year(released: string | null) { return released ? released.slice(0, 4) : "Data indisponível"; }

export function GameCard({ game }: { game: GameItem }) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="media-card game-card">
      <Link className="media-card-link" href={`/games/${game.slug}`} aria-label={`Ver detalhes de ${game.name}`}>
        <div className="poster-frame">
          {failed || !game.backgroundImage ? <span className="poster-fallback">Imagem indisponível</span> : (
            <img className="poster-image" src={game.backgroundImage} alt={`Capa de ${game.name}`} onError={() => setFailed(true)} />
          )}
        </div>
      </Link>
      <div className="media-meta"><div className="media-text">
        <div className="media-title-row"><Link href={`/games/${game.slug}`} className="media-title-link" title={game.name}><h3 className="media-title">{game.name}</h3></Link></div>
        <p className="media-year">{year(game.released)} · Game{game.rating !== null ? ` · ${game.rating.toFixed(1)}` : ""}</p>
      </div></div>
    </article>
  );
}
