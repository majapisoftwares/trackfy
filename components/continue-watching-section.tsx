import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { Rating } from "./rating";

export type ContinueWatchingItem = {
  seriesId: number;
  seriesTitle: string;
  episodeTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  stillPath: string | null;
  posterUrl: string | null;
  voteAverage: number;
};

export function ContinueWatchingSection({
  items,
}: {
  items: ContinueWatchingItem[];
}) {
  return (
    <section className="content-section container" id="continuar-assistindo">
      <div className="section-head">
        <div>
          <h2 className="section-title">Continuar assistindo</h2>
          <p className="section-subtitle">Retome de onde você parou</p>
        </div>
        {items.length > 0 && (
          <a className="section-link" href="#continuar-assistindo">
            Ver todos <ChevronRight aria-hidden="true" size={20} />
          </a>
        )}
      </div>
      {items.length > 0 ? (
        <div className="continue-row">
          {items.map((item) => {
            const imageUrl =
              getTMDBImageUrl(item.stillPath, "w780") ?? item.posterUrl;
            const href = `/series/${item.seriesId}/season/${item.seasonNumber}/episode/${item.episodeNumber}`;

            return (
              <article className="continue-card" key={`${item.seriesId}-${item.seasonNumber}-${item.episodeNumber}`}>
                <Link className="continue-card-link" href={href}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`Episódio ${item.episodeNumber} de ${item.seriesTitle}`}
                      fill
                      sizes="(max-width: 640px) 290px, (max-width: 900px) 340px, 420px"
                    />
                  ) : (
                    <span className="poster-fallback">Imagem indisponível</span>
                  )}
                  <span className="continue-overlay" />
                  <span
                    className="continue-play"
                    aria-label="Marcar como assistido"
                  >
                    <Check size={16} strokeWidth={3} />
                    <span className="continue-play-label">Marcar como assistido</span>
                  </span>
                  <span className="continue-card-copy">
                    <span className="continue-episode-title">{item.episodeTitle}</span>
                    <span className="continue-episode-meta">
                      {item.seriesTitle} · T{item.seasonNumber} E{item.episodeNumber}
                    </span>
                  </span>
                  {item.voteAverage > 0 && (
                    <Rating
                      value={item.voteAverage}
                      className="continue-rating"
                      icon="status"
                    />
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="section-empty">
          Você ainda não tem episódios para continuar.
        </p>
      )}
    </section>
  );
}
