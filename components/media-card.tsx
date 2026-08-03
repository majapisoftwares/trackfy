"use client";

import Image from "next/image";
import Link from "next/link";
import { BookCheck, Check, CircleCheck, Info, Plus } from "lucide-react";
import { useState } from "react";
import { useAuthSession } from "@/src/lib/auth/client";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { useTracking } from "@/src/lib/tracking/client";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { Rating } from "./rating";

function AuthenticatedQuickActions({ item, posterUrl }: { item: MediaItem; posterUrl: string | null }) {
  const { entry, update } = useTracking(item.mediaType, item.id, {
    title: item.title,
    posterUrl,
  });
  const watched = entry?.watched ?? false;
  const inList = entry?.inList ?? false;

  return (
    <div className="media-card-quick-actions">
      <button
        className={`media-card-quick-action ${watched ? "is-watched" : ""}`}
        type="button"
        aria-pressed={watched}
        onClick={() => update({ watched: !watched })}
      >
        {watched ? <CircleCheck aria-hidden="true" size={19} /> : <Check aria-hidden="true" size={17} />}
        {watched ? "Assistido" : "Marcar como assistido"}
      </button>
      {!watched && (
        <button
          className="media-card-quick-action"
          type="button"
          aria-pressed={inList}
          onClick={() => update({ inList: !inList })}
        >
          {inList ? <BookCheck aria-hidden="true" size={17} /> : <Plus aria-hidden="true" size={17} />}
          {inList ? "Na minha lista" : "Minha lista"}
        </button>
      )}
      <Link className="media-card-quick-action" href={getContentHref(item)}>
        <Info aria-hidden="true" size={17} /> Informações
      </Link>
    </div>
  );
}

function QuickActions({ item, posterUrl }: { item: MediaItem; posterUrl: string | null }) {
  const session = useAuthSession();

  if (session.isPending) return null;
  if (session.data?.user) return <AuthenticatedQuickActions item={item} posterUrl={posterUrl} />;

  return (
    <div className="media-card-quick-actions">
      <Link className="media-card-quick-action" href="/login">
        <Check aria-hidden="true" size={17} /> Marcar como assistido
      </Link>
      <Link className="media-card-quick-action" href="/login">
        <Plus aria-hidden="true" size={17} /> Minha lista
      </Link>
      <Link className="media-card-quick-action" href={getContentHref(item)}>
        <Info aria-hidden="true" size={17} /> Informações
      </Link>
    </div>
  );
}

function getContentHref(item: MediaItem) {
  return item.mediaType === "movie" ? `/movie/${item.id}` : `/series/${item.id}`;
}

export function MediaCard({ item, showQuickActions = false }: { item: MediaItem; showQuickActions?: boolean }) {
  const [failed, setFailed] = useState(false);
  const posterUrl = getTMDBImageUrl(item.posterPath, "w500");
  const href = getContentHref(item);
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
      {showQuickActions && <QuickActions item={item} posterUrl={posterUrl} />}
    </article>
  );
}
