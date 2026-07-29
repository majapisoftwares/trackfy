import { Info, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { Rating } from "./rating";

export function HeroBanner({ item }: { item: MediaItem }) {
  const backdropUrl = getTMDBImageUrl(item.backdropPath, "original");
  const href =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/series/${item.id}`;
  const typeLabel = item.mediaType === "movie" ? "Filme" : "Série";

  return (
    <>
      {backdropUrl && (
        <Image
          className="hero-background"
          src={backdropUrl}
          alt=""
          fill
          sizes="100vw"
          priority
        />
      )}
      <section className="hero-content container" aria-labelledby="hero-title">
        <div className="hero-copy">
        <h1 className="hero-title" id="hero-title">{item.title}</h1>
        <div className="ratings-bar" aria-label="Informações da produção">
          <Rating value={item.voteAverage} className="rating-piece" />
          <span className="rating-divider" aria-hidden="true" />
          <span>{item.year ?? "Ano indisponível"}</span>
          <span className="rating-divider" aria-hidden="true" />
          <span>{typeLabel}</span>
        </div>
        <p className="hero-description">
          {item.overview || "Sinopse indisponível para este título."}
        </p>
        <div className="hero-actions">
          <button className="hero-button primary" type="button">
            <Plus aria-hidden="true" size={20} />
            Adicionar à minha lista
          </button>
          <Link className="hero-button secondary" href={href}>
            <Info aria-hidden="true" size={20} />
            Mais informações
          </Link>
        </div>
      </div>
      </section>
    </>
  );
}
