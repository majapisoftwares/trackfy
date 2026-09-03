"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTracking } from "@/src/lib/tracking/client";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { useEpisodeDrawer } from "@/components/episode-drawer-context";

export type EpisodeCardProps = {
  seriesId: number;
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  posterUrl?: string | null;
  stillPath?: string | null;
  isWatched?: boolean;
  variant?: "continue" | "history";
};

export function EpisodeCard({
  seriesId,
  seriesTitle,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  posterUrl: rawPosterUrl,
  stillPath: rawStillPath,
  isWatched = false,
  variant = "continue",
}: EpisodeCardProps) {
  const isHorizontal = variant === "continue";
  const [showMenu, setShowMenu] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openEpisodeDrawer } = useEpisodeDrawer();

  const stillUrl = rawStillPath
    ? rawStillPath.startsWith("http")
      ? rawStillPath
      : getTMDBImageUrl(rawStillPath, "w780")
    : null;

  const posterUrl = rawPosterUrl
    ? rawPosterUrl.startsWith("http")
      ? rawPosterUrl
      : getTMDBImageUrl(rawPosterUrl, "w500")
    : null;

  const preferredImage = isHorizontal ? (stillUrl || posterUrl) : posterUrl;
  const [activeImage, setActiveImage] = useState<string | null>(preferredImage);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const nextImg = isHorizontal ? (stillUrl || posterUrl) : posterUrl;
    setActiveImage(nextImg);
    setImgFailed(false);
  }, [isHorizontal, stillUrl, posterUrl]);

  useEffect(() => {
    if (!showMenu) return;

    const repositionMobileMenu = () => {
      const menu = menuRef.current;
      const trigger = menuTriggerRef.current;
      if (!menu || !trigger) return;

      const menuWrapper = menu.parentElement;
      if (!menuWrapper) return;

      if (window.innerWidth > 640) {
        menu.style.position = "";
        menu.style.left = "";
        menu.style.top = "";
        menu.style.right = "";
        menu.style.bottom = "";
        return;
      }

      const viewportPadding = 8;
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const wrapperRect = menuWrapper.getBoundingClientRect();
      const maxLeft = Math.max(
        viewportPadding,
        window.innerWidth - menuRect.width - viewportPadding,
      );
      const maxTop = Math.max(
        viewportPadding,
        window.innerHeight - menuRect.height - viewportPadding,
      );
      const preferredLeft = triggerRect.right - menuRect.width;
      const preferredTop = triggerRect.bottom + 6;

      const left = Math.min(Math.max(preferredLeft, viewportPadding), maxLeft);
      const top = Math.min(Math.max(preferredTop, viewportPadding), maxTop);

      // The card is transformed while its menu is open, so fixed positioning
      // would use the card as its containing block. Keep the menu absolute and
      // convert the clamped viewport coordinates into wrapper coordinates.
      menu.style.position = "absolute";
      menu.style.left = `${left - wrapperRect.left}px`;
      menu.style.top = `${top - wrapperRect.top}px`;
      menu.style.right = "auto";
      menu.style.bottom = "auto";
    };

    const frame = window.requestAnimationFrame(repositionMobileMenu);
    window.addEventListener("resize", repositionMobileMenu);
    window.addEventListener("scroll", repositionMobileMenu, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", repositionMobileMenu);
      window.removeEventListener("scroll", repositionMobileMenu, true);
    };
  }, [showMenu]);

  const handleImageError = () => {
    if (isHorizontal && activeImage === stillUrl && posterUrl && stillUrl !== posterUrl) {
      setActiveImage(posterUrl);
    } else {
      setImgFailed(true);
    }
  };

  const seriesHref = `/series/${seriesId}`;

  const { entry, updateEpisodes } = useTracking("tv", seriesId, {
    title: seriesTitle,
    posterUrl: posterUrl ?? undefined,
  });

  const isActuallyWatched =
    isWatched ||
    Boolean(
      entry?.watchedEpisodes.some(
        (ep) =>
          ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber,
      ),
    );

  const handleToggleWatched = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateEpisodes({
      episodes: [{ seasonNumber, episodeNumber }],
      watched: !isActuallyWatched,
      target: "watched",
    });
  };

  const handleOpenDrawer = (e: React.MouseEvent) => {
    e.preventDefault();
    openEpisodeDrawer({
      showId: seriesId,
      seasonNumber,
      episodeNumber,
      initialData: {
        title: episodeTitle,
        showTitle: seriesTitle,
        imageUrl: activeImage,
      },
    });
  };

  return (
    <article
      className={`trakt-card ${isHorizontal ? "trakt-card--horizontal" : ""} ${
        showMenu ? "is-menu-open" : ""
      }`}
      key={`${seriesId}-${seasonNumber}-${episodeNumber}`}
    >
      <div className={`trakt-poster-frame ${isHorizontal ? "trakt-poster-frame--horizontal" : ""}`}>
        <button
          type="button"
          className="trakt-poster-link w-full text-left"
          onClick={handleOpenDrawer}
          aria-label={`Episódio ${episodeNumber} de ${seriesTitle}`}
        >
          {imgFailed || !activeImage ? (
            <span className="poster-fallback">{seriesTitle}</span>
          ) : (
            <Image
              className="trakt-poster-image"
              src={activeImage}
              alt={`Episódio ${episodeNumber} de ${seriesTitle}`}
              fill
              sizes={
                isHorizontal
                  ? "(max-width: 640px) 290px, (max-width: 900px) 340px, 420px"
                  : "(max-width: 640px) 140px, (max-width: 900px) 160px, 180px"
              }
              onError={handleImageError}
            />
          )}
          <span className="trakt-poster-overlay" />

        </button>

        {/* 3 dots menu button */}
        <div className="trakt-menu-wrapper">
          <button
            type="button"
            ref={menuTriggerRef}
            className="trakt-more-btn"
            data-tooltip="Opções"
            data-tooltip-align="right"
            aria-label="Opções"
            aria-expanded={showMenu}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
          >
            <MoreVertical size={16} aria-hidden="true" />
          </button>

          {showMenu && (
            <>
              <div
                className="trakt-menu-backdrop"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div ref={menuRef} className="trakt-menu-dropdown">
                <button
                  type="button"
                  className="trakt-menu-item text-left"
                  onClick={(e) => {
                    handleOpenDrawer(e);
                    setShowMenu(false);
                  }}
                >
                  Detalhes do episódio
                </button>
                <Link
                  href={seriesHref}
                  className="trakt-menu-item"
                  onClick={() => setShowMenu(false)}
                >
                  Página da série
                </Link>
                <button
                  type="button"
                  className="trakt-menu-item"
                  onClick={(e) => {
                    handleToggleWatched(e);
                    setShowMenu(false);
                  }}
                >
                  {isActuallyWatched
                    ? "Desmarcar como assistido"
                    : "Marcar como assistido"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meta text and check action */}
      <div className="trakt-meta-row">
        <div className="trakt-info">
          <Link href={seriesHref} className="trakt-title" title={seriesTitle}>
            {seriesTitle}
          </Link>
          <span
            className="trakt-episode-code"
            title={
              episodeTitle
                ? `T${seasonNumber} • E${episodeNumber} · ${episodeTitle}`
                : `T${seasonNumber} • E${episodeNumber}`
            }
          >
            T{seasonNumber} • E{episodeNumber}
            {isHorizontal && episodeTitle && episodeTitle !== `Episódio ${episodeNumber}` && episodeTitle !== `Episode ${episodeNumber}`
              ? ` · ${episodeTitle}`
              : ""}
          </span>
        </div>

        <button
          type="button"
          className={`trakt-check-btn ${
            isActuallyWatched ? "is-watched" : "is-unwatched"
          }`}
          data-tooltip={
            isActuallyWatched
              ? "Desmarcar como assistido"
              : "Marcar como assistido"
          }
          data-tooltip-align="right"
          aria-label={
            isActuallyWatched
              ? `Desmarcar T${seasonNumber} E${episodeNumber} como assistido`
              : `Marcar T${seasonNumber} E${episodeNumber} como assistido`
          }
          onClick={handleToggleWatched}
        >
          {isActuallyWatched ? (
            <Check size={16} strokeWidth={2.8} />
          ) : (
            <Check size={16} strokeWidth={2.2} />
          )}
        </button>
      </div>
    </article>
  );
}
