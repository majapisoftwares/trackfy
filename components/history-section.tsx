import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HistoryEpisodeItem } from "@/src/lib/tracking/history";
import { EpisodeCard } from "./episode-card";

export function HistorySection({
  items,
  title = "Histórico",
  subtitle = "Último episódio marcado como assistido",
  href = "/arquivados",
  showAll = true,
}: {
  items: HistoryEpisodeItem[];
  title?: string;
  subtitle?: string;
  href?: string;
  showAll?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="content-section container" id="historico">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            <Link className="section-title-link" href={href}>
              {title}
            </Link>
          </h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        {showAll && items.length > 0 && (
          <Link className="section-link" href={href}>
            Ver todos <ChevronRight aria-hidden="true" size={20} />
          </Link>
        )}
      </div>

      <div className="trakt-row">
        {items.map((item) => (
          <EpisodeCard
            key={`history-${item.seriesId}-${item.seasonNumber}-${item.episodeNumber}`}
            seriesId={item.seriesId}
            seriesTitle={item.seriesTitle}
            seasonNumber={item.seasonNumber}
            episodeNumber={item.episodeNumber}
            episodeTitle={item.episodeTitle}
            posterUrl={item.posterUrl}
            stillPath={item.stillPath}
            isWatched={true}
            variant="history"
          />
        ))}
      </div>
    </section>
  );
}
