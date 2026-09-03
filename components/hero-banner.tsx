"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Info, Plus, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { useTracking } from "@/src/lib/tracking/client";
import { useAuthSession } from "@/src/lib/auth/client";
import { FixedBackdrop } from "@/components/fixed-backdrop";
import type { MediaItem } from "@/src/lib/tmdb/types";

const TMDB_GENRES: Record<number, string> = {
  28: "Ação",
  12: "Aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  14: "Fantasia",
  36: "História",
  27: "Terror",
  10402: "Música",
  9648: "Mistério",
  10749: "Romance",
  878: "Ficção",
  10770: "Cinema TV",
  53: "Suspense",
  10752: "Guerra",
  37: "Faroeste",
  10759: "Ação & Aventura",
  10762: "Infantil",
  10763: "Notícias",
  10764: "Reality",
  10765: "Ficção Científica",
  10766: "Novela",
  10767: "Talk Show",
  10768: "Guerra & Política",
};

function getGenreNames(genreIds?: number[]): string[] {
  if (!genreIds || genreIds.length === 0) return [];
  return genreIds
    .map((id) => TMDB_GENRES[id])
    .filter((name): name is string => Boolean(name))
    .filter((name, index, self) => self.indexOf(name) === index)
    .slice(0, 3);
}

export interface HeroBannerProps {
  item?: MediaItem | null;
  items?: MediaItem[];
  initialItem?: MediaItem;
  backdropPosition?: string;
  className?: string;
}



function HeroSlideAction({ item }: { item: MediaItem }) {
  const router = useRouter();
  const session = useAuthSession();
  const isAuthenticated = Boolean(session.data?.user);
  const posterPath = item.posterPath || (item as unknown as { poster_path?: string }).poster_path || null;
  const posterUrl = getTMDBImageUrl(posterPath, "w500");
  const mediaType = item.mediaType || (item as unknown as { media_type?: "movie" | "tv" }).media_type || "movie";
  const { entry, update } = useTracking(mediaType, item.id, {
    title: item.title,
    posterUrl,
  });

  const inList = entry?.inList ?? false;
  const href = mediaType === "movie" ? `/movie/${item.id}` : `/series/${item.id}`;

  function handleListToggle() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    update({ inList: !inList });
  }

  return (
    <div className="hero-actions">
      <button
        type="button"
        className={`hero-action-primary ${inList ? "is-active" : ""}`}
        onClick={handleListToggle}
        aria-pressed={inList}
      >
        {inList ? (
          <>
            <Check size={18} strokeWidth={2.5} />
            <span>Na minha lista</span>
          </>
        ) : (
          <>
            <Plus size={18} strokeWidth={2.5} />
            <span className="hero-primary-text-desktop">Adicionar a minha lista</span>
            <span className="hero-primary-text-mobile">Minha lista</span>
          </>
        )}
      </button>

      <Link
        className="hero-action-secondary"
        href={href}
        aria-label="Mais informações"
        title="Mais informações"
      >
        <Info size={18} />
        <span className="hero-secondary-text">Mais informações</span>
      </Link>
    </div>
  );
}

export function HeroBanner({
  item,
  items,
  initialItem,
  backdropPosition,
  className = "",
}: HeroBannerProps) {
  const allItems = useMemo(() => {
    if (items && items.length > 0) return items;
    if (item) return [item];
    if (initialItem) return [initialItem];
    return [];
  }, [items, item, initialItem]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentItem = allItems[activeIndex] ?? allItems[0] ?? null;

  const nextSlide = useCallback(() => {
    if (allItems.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % allItems.length);
  }, [allItems.length]);

  useEffect(() => {
    if (allItems.length <= 1 || isPaused) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [allItems.length, isPaused, nextSlide]);

  if (!currentItem) return null;

  // TMDB property normalization to support both camelCase and snake_case
  const rawItem = currentItem as unknown as Record<string, unknown>;
  const title = currentItem.title || (rawItem.name as string) || "";
  const overview = currentItem.overview || (rawItem.overview as string) || "";
  const backdropPath =
    currentItem.backdropPath || (rawItem.backdrop_path as string) || null;
  const releaseDate =
    currentItem.releaseDate ||
    (rawItem.release_date as string) ||
    (rawItem.first_air_date as string) ||
    null;
  const voteAverage =
    currentItem.voteAverage ?? (rawItem.vote_average as number) ?? 0;
  const mediaType =
    currentItem.mediaType || (rawItem.media_type as "movie" | "tv") || "movie";
  const year =
    currentItem.year ||
    (releaseDate ? new Date(releaseDate).getFullYear() : null);
  const genreIds = currentItem.genreIds || (rawItem.genre_ids as number[]) || [];

  const backdropUrl = backdropPath ? getTMDBImageUrl(backdropPath, "original") : null;
  const genres = getGenreNames(genreIds);
  const ratingPercent = Math.round(voteAverage * 10);
  const imdbScore = voteAverage > 0 ? voteAverage.toFixed(1) : "—";
  const typeLabel = mediaType === "movie" ? "Filme" : "Em andamento";

  // Preload next backdrop image for seamless transition
  const nextItem = allItems[(activeIndex + 1) % allItems.length];
  const nextBackdropPath =
    nextItem?.backdropPath ||
    (nextItem as unknown as { backdrop_path?: string })?.backdrop_path ||
    null;
  const nextBackdropUrl = nextBackdropPath
    ? getTMDBImageUrl(nextBackdropPath, "original")
    : null;

  // Custom backdrop object-position (if specified via props or item)
  const itemBackdropPosition =
    backdropPosition ||
    (rawItem.backdropPosition as string) ||
    undefined;

  return (
    <>
      {/* Fixed blurred backdrop layer that stays fixed as site scrolls */}
      <FixedBackdrop
        backdropUrl={backdropUrl}
        activeId={currentItem.id}
        backdropPosition={itemBackdropPosition}
      />

      <div
        className={`hero-banner-root ${className}`.trim()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        tabIndex={0}
        role="region"
        aria-label="Destaques cinematográficos"
      >
      {/* Hidden preload for next slide image */}
      {nextBackdropUrl && (
        <link rel="preload" as="image" href={nextBackdropUrl} />
      )}

      {/* Hero content container constrained to site grid */}
      <section className="hero-content container" aria-labelledby="hero-title">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentItem.id}
            className="hero-copy"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h1 className="hero-title" id="hero-title">
              {title}
            </h1>

            <div className="hero-meta-row" aria-label="Informações do conteúdo">
              {voteAverage > 0 && (
                <span className="hero-score-badge">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>{ratingPercent}%</span>
                </span>
              )}

              <span className="hero-imdb-badge">
                <b className="imdb">IMDb</b>
                <span>{imdbScore}</span>
              </span>

              {year && (
                <>
                  <span className="hero-dot-divider" />
                  <span>{year}</span>
                </>
              )}

              <span className="hero-dot-divider" />
              <span>{typeLabel}</span>
            </div>

            {genres.length > 0 && (
              <div className="hero-genres-row" aria-label="Gêneros">
                {genres.map((genre) => (
                  <span key={genre} className="hero-genre-pill">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <p className="hero-description">
              {overview || "Sinopse indisponível para este título."}
            </p>

            <HeroSlideAction item={currentItem} />
          </motion.div>
        </AnimatePresence>
      </section>
      </div>
    </>
  );
}
