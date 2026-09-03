"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { useEpisodeDrawer } from "@/components/episode-drawer-context";

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
  maxItems,
  showAll = false,
}: {
  items: UpcomingEpisodeItem[];
  maxItems?: number;
  showAll?: boolean;
}) {
  const { openEpisodeDrawer } = useEpisodeDrawer();

  if (items.length === 0) return null;
  const displayedItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <section className="content-section container" id="proximos-episodios">
      <div className="section-head">
        <div>
          <h2 className="section-title">Próximos episódios</h2>
          <p className="section-subtitle">
            Acompanhe os próximos lançamentos das séries que você assiste
          </p>
        </div>
        {showAll && maxItems && items.length > maxItems && (
          <Link className="section-link" href="/episodios-para-assistir">
            Ver todos <ChevronRight aria-hidden="true" size={20} />
          </Link>
        )}
      </div>
      <div className="continue-row">
        {displayedItems.map((item) => {
          const imageUrl =
            getTMDBImageUrl(item.stillPath, "w780") ?? item.posterUrl;

          return (
            <article
              className="continue-card"
              key={`${item.seriesId}-${item.seasonNumber}-${item.episodeNumber}`}
            >
              <button
                type="button"
                className="continue-card-link w-full text-left bg-transparent border-0 p-0 cursor-pointer"
                onClick={() =>
                  openEpisodeDrawer({
                    showId: item.seriesId,
                    seasonNumber: item.seasonNumber,
                    episodeNumber: item.episodeNumber,
                    initialData: {
                      title: item.episodeTitle,
                      showTitle: item.seriesTitle,
                      imageUrl: imageUrl,
                      airDate: item.airDate,
                    },
                  })
                }
              >
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
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
