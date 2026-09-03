import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ContinueWatchingItem } from "@/src/lib/tracking/continue-watching";
import { EpisodeCard } from "./episode-card";

export type { ContinueWatchingItem } from "@/src/lib/tracking/continue-watching";

export function ContinueWatchingSection({
  items,
  title = "Assistir a seguir",
  subtitle = "Retome de onde você parou",
  href = "/episodios-para-assistir",
  showAll = true,
}: {
  items: ContinueWatchingItem[];
  title?: string;
  subtitle?: string;
  href?: string;
  showAll?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="content-section container" id="continuar-assistindo">
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

      <div className="trakt-row trakt-row--horizontal">
        {items.map((item) => (
          <EpisodeCard
            key={`continue-${item.seriesId}-${item.seasonNumber}-${item.episodeNumber}`}
            seriesId={item.seriesId}
            seriesTitle={item.seriesTitle}
            seasonNumber={item.seasonNumber}
            episodeNumber={item.episodeNumber}
            episodeTitle={item.episodeTitle}
            posterUrl={item.posterUrl}
            stillPath={item.stillPath}
            isWatched={false}
            variant="continue"
          />
        ))}
      </div>
    </section>
  );
}
