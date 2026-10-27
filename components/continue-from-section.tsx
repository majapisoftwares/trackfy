"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ContinueWatchingItem } from "@/src/lib/tracking/continue-watching";
import { EpisodeCard } from "./episode-card";

export function ContinueFromSection({
  episodeItems,
}: {
  episodeItems: ContinueWatchingItem[];
}) {
  const [visibleEpisodes, setVisibleEpisodes] = useState(episodeItems);
  const hasItems = visibleEpisodes.length > 0;

  const replaceCompletedEpisode = (completed: ContinueWatchingItem, nextEpisode: ContinueWatchingItem | null) => {
    setVisibleEpisodes((current) => {
      const index = current.findIndex((item) =>
        item.seriesId === completed.seriesId &&
        item.seasonNumber === completed.seasonNumber &&
        item.episodeNumber === completed.episodeNumber,
      );
      if (index < 0) return current;
      const remaining = current.filter((_, itemIndex) => itemIndex !== index);
      return nextEpisode ? [...remaining.slice(0, index), nextEpisode, ...remaining.slice(index)] : remaining;
    });
  };

  return (
    <section className="content-section container" id="continue-de-onde-parou">
      <div className="section-head">
        <div>
          <h2 className="section-title">Continue de onde parou</h2>
          <p className="section-subtitle">Retome suas séries e animes em andamento</p>
        </div>
        {hasItems && <Link className="section-link" href="/episodios-para-assistir">Ver episódios <ChevronRight aria-hidden="true" size={20} /></Link>}
      </div>

      {hasItems ? (
        <div className="mixed-section-content">
          <div className="mixed-section-group">
            <h3 className="section-group-label">Séries e animes</h3>
            <div className="trakt-row trakt-row--horizontal">
              {visibleEpisodes.map((item) => (
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
                  onEpisodeCompleted={(nextEpisode) => replaceCompletedEpisode(item, nextEpisode)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="section-empty">
          <p>Você ainda não tem séries ou animes em andamento.</p>
          <Link className="section-empty-action" href="/populares">Explorar conteúdos</Link>
        </div>
      )}
    </section>
  );
}
