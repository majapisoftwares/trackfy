"use client";

import { Check, Info, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { useTracking } from "@/src/lib/tracking/client";
import { useAuthSession } from "@/src/lib/auth/client";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { Rating } from "./rating";
import { CommunityRating } from "./community-rating";

export function HeroBanner({ item }: { item: MediaItem }) {
  const router = useRouter();
  const backdropUrl = getTMDBImageUrl(item.backdropPath, "original");
  const href =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/series/${item.id}`;
  const typeLabel = item.mediaType === "movie" ? "Filme" : "Série";
  const posterUrl = getTMDBImageUrl(item.posterPath, "w500");
  const { entry, update } = useTracking(item.mediaType, item.id, {
    title: item.title,
    posterUrl,
  });
  const inList = entry?.inList ?? false;
  const watched = entry?.watched ?? false;
  const session = useAuthSession();

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
          <span><b className="imdb">IMDb</b> {item.voteAverage.toFixed(1)}</span>
          <span className="rating-divider" aria-hidden="true" />
          <CommunityRating
            mediaType={item.mediaType}
            mediaId={item.id}
            imdbRating={item.voteAverage}
          />
          <span className="rating-divider" aria-hidden="true" />
          <span>{item.year ?? "Ano indisponível"}</span>
          <span className="rating-divider" aria-hidden="true" />
          <span>{typeLabel}</span>
        </div>
        <p className="hero-description">
          {item.overview || "Sinopse indisponível para este título."}
        </p>
        <div className="hero-actions">
          {session.data?.user && !watched && <button
            aria-pressed={inList}
            className={`hero-button primary ${inList ? "active" : ""}`}
            onClick={() =>
              update(
                { inList: !inList },
                { onSuccess: () => router.refresh() },
              )
            }
            type="button"
          >
            {inList ? <Check aria-hidden="true" size={20} /> : <Plus aria-hidden="true" size={20} />}
            {inList ? "Na minha lista" : "Adicionar à minha lista"}
          </button>}
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
