"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Season = {
  number: number;
};

export function SeasonCarousel({
  seasons,
  activeSeason,
  getHref,
  onSelect,
}: {
  seasons: Season[];
  activeSeason: number;
  getHref?: (season: Season) => string;
  onSelect?: (season: Season) => void;
}) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({
    canGoBack: false,
    canGoForward: seasons.length > 4,
  });

  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;

    const activeIndex = seasons.findIndex(
      (season) => season.number === activeSeason,
    );
    if (activeIndex > 3) {
      const page = Math.floor(activeIndex / 4);
      tabs.scrollLeft = page * tabs.clientWidth;
    }

    const update = () => {
      setScroll({
        canGoBack: tabs.scrollLeft > 1,
        canGoForward:
          tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 1,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(tabs);
    update();

    return () => observer.disconnect();
  }, [activeSeason, seasons]);

  function scrollByPage(direction: -1 | 1) {
    const tabs = tabsRef.current;
    if (!tabs) return;
    tabs.scrollBy({ left: direction * tabs.clientWidth, behavior: "smooth" });
  }

  function updateScroll() {
    const tabs = tabsRef.current;
    if (!tabs) return;
    setScroll({
      canGoBack: tabs.scrollLeft > 1,
      canGoForward:
        tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 1,
    });
  }

  return (
    <div
      className={`season-carousel ${seasons.length <= 4 ? "single-page" : ""}`}
      style={{ "--season-count": Math.min(seasons.length, 4) } as React.CSSProperties}
    >
      <button
        className="season-scroll-button"
        type="button"
        aria-label="Mostrar temporadas anteriores"
        disabled={!scroll.canGoBack}
        onClick={() => scrollByPage(-1)}
      >
        <ChevronLeft size={20} />
      </button>
      <div
        className="season-tabs"
        ref={tabsRef}
        role="tablist"
        aria-label="Temporadas"
        onScroll={updateScroll}
      >
        {seasons.map((season) => {
          const label = (
            <>
              <span className="season-tab-full">Temporada {season.number}</span>
              <span className="season-tab-short">T{season.number}</span>
            </>
          );
          const commonProps = {
            className: activeSeason === season.number ? "active" : "",
            "aria-label": `Temporada ${season.number}`,
            "aria-selected": activeSeason === season.number,
            role: "tab",
          };

          return getHref ? (
            <Link {...commonProps} href={getHref(season)} key={season.number}>
              {label}
            </Link>
          ) : (
            <button
              {...commonProps}
              key={season.number}
              type="button"
              onClick={() => onSelect?.(season)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button
        className="season-scroll-button"
        type="button"
        aria-label="Mostrar próximas temporadas"
        disabled={!scroll.canGoForward}
        onClick={() => scrollByPage(1)}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
