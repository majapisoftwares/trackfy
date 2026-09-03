"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { EpisodeDrawer } from "./episode-drawer";
import type { EpisodeDrawerProps } from "./episode-drawer";

type EpisodeDrawerOptions = {
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  initialData?: EpisodeDrawerProps["initialData"];
};

type EpisodeDrawerContextType = {
  openEpisodeDrawer: (options: EpisodeDrawerOptions) => void;
  closeEpisodeDrawer: () => void;
};

const EpisodeDrawerContext = createContext<EpisodeDrawerContextType | null>(null);

export function EpisodeDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeParams, setActiveParams] = useState<EpisodeDrawerOptions | null>(null);

  const openEpisodeDrawer = useCallback((options: EpisodeDrawerOptions) => {
    setActiveParams(options);
    setIsOpen(true);
  }, []);

  const closeEpisodeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <EpisodeDrawerContext.Provider value={{ openEpisodeDrawer, closeEpisodeDrawer }}>
      {children}
      {activeParams && (
        <EpisodeDrawer
          open={isOpen}
          onOpenChange={setIsOpen}
          showId={activeParams.showId}
          seasonNumber={activeParams.seasonNumber}
          episodeNumber={activeParams.episodeNumber}
          initialData={activeParams.initialData}
        />
      )}
    </EpisodeDrawerContext.Provider>
  );
}

export function useEpisodeDrawer() {
  const context = useContext(EpisodeDrawerContext);
  if (!context) {
    throw new Error("useEpisodeDrawer must be used within an EpisodeDrawerProvider");
  }
  return context;
}

