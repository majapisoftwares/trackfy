"use client";

import { useState } from "react";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { MediaRow } from "./media-row";

type DiscoveryTab = "movies" | "series" | "anime";

export function DiscoverySection({
  movies,
  series,
  anime,
}: {
  movies: MediaItem[];
  series: MediaItem[];
  anime: MediaItem[];
}) {
  const [activeTab, setActiveTab] = useState<DiscoveryTab>("movies");
  const tabs: Array<{ id: DiscoveryTab; label: string; count: number }> = [
    { id: "movies", label: "Filmes", count: movies.length },
    { id: "series", label: "Séries", count: series.length },
    { id: "anime", label: "Animes", count: anime.length },
  ];
  const activeItems = activeTab === "movies" ? movies : activeTab === "series" ? series : anime;

  return (
    <section className="content-section container" id="em-alta">
      <div className="section-head discovery-head">
        <div>
          <h2 className="section-title">Em alta</h2>
          <p className="section-subtitle">Encontre o que está em destaque agora</p>
        </div>
        <div className="discovery-tabs" role="tablist" aria-label="Categorias em alta">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`discovery-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeItems.length > 0 ? (
        <MediaRow items={activeItems} showQuickActions />
      ) : (
        <div className="section-empty"><p>Esta categoria está temporariamente indisponível.</p></div>
      )}
    </section>
  );
}
