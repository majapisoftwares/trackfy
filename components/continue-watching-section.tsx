"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
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
  const [visibleItems, setVisibleItems] = useState(items);

  if (visibleItems.length === 0) return null;

  const replaceCompletedEpisode = (
    completed: ContinueWatchingItem,
    nextEpisode: ContinueWatchingItem | null,
  ) => {
    setVisibleItems((current) => {
      const index = current.findIndex(
        (item) =>
          item.seriesId === completed.seriesId &&
          item.seasonNumber === completed.seasonNumber &&
          item.episodeNumber === completed.episodeNumber,
      );
      if (index < 0) return current;

      const remaining = current.filter((_, itemIndex) => itemIndex !== index);
      return nextEpisode
        ? [...remaining.slice(0, index), nextEpisode, ...remaining.slice(index)]
        : remaining;
    });
  };

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
        {showAll && visibleItems.length > 0 && (
          <Link className="section-link" href={href}>
            Ver todos <ChevronRight aria-hidden="true" size={20} />
          </Link>
        )}
      </div>

      <div className="trakt-row trakt-row--horizontal">
        {visibleItems.map((item) => (
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
            onEpisodeCompleted={(nextEpisode) =>
              replaceCompletedEpisode(item, nextEpisode)
            }
          />
        ))}
      </div>
    </section>
  );
}
