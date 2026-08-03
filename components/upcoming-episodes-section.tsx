import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";

export type UpcomingEpisodeItem = {
  seriesId: number;
  seriesTitle: string;
  episodeTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  stillPath: string | null;
  posterUrl: string | null;
  airDate: string;
};

function releaseLabel(airDate: string): string {
  return `Estreia em ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${airDate}T00:00:00Z`))}`;
}

export function UpcomingEpisodesSection({
  items,
}: {
  items: UpcomingEpisodeItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="content-section container" id="proximos-episodios">
      <div className="section-head">
        <div>
          <h2 className="section-title">Próximos episódios</h2>
          <p className="section-subtitle">
            Acompanhe os próximos lançamentos das séries que você assiste
          </p>
        </div>
      </div>
      <div className="continue-row">
        {items.map((item) => {
          const imageUrl =
            getTMDBImageUrl(item.stillPath, "w780") ?? item.posterUrl;
          const href = `/series/${item.seriesId}/season/${item.seasonNumber}/episode/${item.episodeNumber}`;

          return (
            <article
              className="continue-card"
              key={`${item.seriesId}-${item.seasonNumber}-${item.episodeNumber}`}
            >
              <Link className="continue-card-link" href={href}>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`Próximo episódio de ${item.seriesTitle}`}
                    fill
                    sizes="(max-width: 640px) 290px, (max-width: 900px) 340px, 420px"
                  />
                ) : (
                  <span className="poster-fallback">Imagem indisponível</span>
                )}
                <span className="continue-overlay" />
                <span className="upcoming-release">
                  <CalendarDays size={15} aria-hidden="true" />
                  {releaseLabel(item.airDate)}
                </span>
                <span className="continue-card-copy">
                  <span className="continue-episode-title">{item.episodeTitle}</span>
                  <span className="continue-episode-meta">
                    {item.seriesTitle} · T{item.seasonNumber} E{item.episodeNumber}
                  </span>
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
