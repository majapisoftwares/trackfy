"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, LoaderCircle } from "lucide-react";
import type { MediaItem, PaginatedMedia } from "@/src/lib/tmdb/types";
import type { GameItem, GamePage } from "@/src/lib/rawg/types";
import { MediaCard } from "./media-card";
import { GameCard } from "./game-card";
import { FixedBackdrop } from "./fixed-backdrop";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";

function appendUniqueMedia(
  current: MediaItem[],
  incoming: MediaItem[],
): MediaItem[] {
  const existingIds = new Set(
    current.map((item) => `${item.mediaType}-${item.id}`),
  );
  const newItems = incoming.filter(
    (item) => !existingIds.has(`${item.mediaType}-${item.id}`),
  );
  return [...current, ...newItems];
}

function appendUniqueGames(current: GameItem[], incoming: GameItem[]): GameItem[] {
  const existingIds = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !existingIds.has(item.id))];
}

export function SearchScreen({
  initialMedia = [],
  initialTotalPages = 1,
}: {
  initialMedia?: MediaItem[];
  initialTotalPages?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [gameResults, setGameResults] = useState<GameItem[]>([]);
  const [gameSearchPage, setGameSearchPage] = useState(1);
  const [gameSearchTotal, setGameSearchTotal] = useState(0);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(false);

  const [trendingItems, setTrendingItems] = useState<MediaItem[]>(initialMedia);
  const [trendingPage, setTrendingPage] = useState(1);
  const [trendingTotalPages, setTrendingTotalPages] = useState(initialTotalPages);

  const [loadingMore, setLoadingMore] = useState(false);

  const normalizedQuery = query.trim();
  const isSearchActive = normalizedQuery.length >= 2;
  const isSearching = isSearchActive && (loadingSearch || pendingSearch);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isSearchActive) return;

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const mediaSearchParams = new URLSearchParams({
          query: normalizedQuery,
          page: "1",
        });
        const gameSearchParams = new URLSearchParams({
          search: normalizedQuery,
          page: "1",
          pageSize: "20",
          strictSearch: "1",
        });
        const [mediaResponse, gamesResponse] = await Promise.allSettled([
          fetch(`/api/tmdb/search?${mediaSearchParams}`, { signal: controller.signal }),
          fetch(`/api/games?${gameSearchParams}`, { signal: controller.signal }),
        ]);

        if (mediaResponse.status === "fulfilled" && mediaResponse.value.ok) {
          const data = (await mediaResponse.value.json()) as PaginatedMedia;
          setResults(data.results || []);
          setSearchPage(data.page || 1);
          setSearchTotalPages(data.totalPages || 1);
        } else {
          setResults([]);
          setSearchPage(1);
          setSearchTotalPages(1);
        }

        if (gamesResponse.status === "fulfilled" && gamesResponse.value.ok) {
          const data = (await gamesResponse.value.json()) as GamePage;
          setGameResults(data.results || []);
          setGameSearchPage(data.page || 1);
          setGameSearchTotal(data.count || 0);
        } else {
          setGameResults([]);
          setGameSearchPage(1);
          setGameSearchTotal(0);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setGameResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSearch(false);
          setPendingSearch(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery, isSearchActive]);

  const loadMore = useCallback(async () => {
    if (loadingMore || isSearching) return;

    if (isSearchActive) {
      const hasMoreMedia = searchPage < searchTotalPages;
      const hasMoreGames = gameSearchPage * 20 < gameSearchTotal;
      if (!hasMoreMedia && !hasMoreGames) return;
      setLoadingMore(true);

      try {
        const mediaSearchParams = new URLSearchParams({
          query: normalizedQuery,
          page: String(searchPage + 1),
        });
        const gameSearchParams = new URLSearchParams({
          search: normalizedQuery,
          page: String(gameSearchPage + 1),
          pageSize: "20",
          strictSearch: "1",
        });
        const [mediaResponse, gamesResponse] = await Promise.all([
          hasMoreMedia
            ? fetch(`/api/tmdb/search?${mediaSearchParams}`)
            : Promise.resolve(null),
          hasMoreGames
            ? fetch(`/api/games?${gameSearchParams}`)
            : Promise.resolve(null),
        ]);

        if (mediaResponse?.ok) {
          const data = (await mediaResponse.json()) as PaginatedMedia;
          setResults((prev) => appendUniqueMedia(prev, data.results || []));
          setSearchPage(data.page || searchPage + 1);
          setSearchTotalPages(data.totalPages || searchPage + 1);
        } else if (hasMoreMedia) {
          setSearchTotalPages(searchPage);
        }

        if (gamesResponse?.ok) {
          const data = (await gamesResponse.json()) as GamePage;
          setGameResults((prev) => appendUniqueGames(prev, data.results || []));
          setGameSearchPage(data.page || gameSearchPage + 1);
          setGameSearchTotal(data.count || gameSearchPage * 20);
        } else if (hasMoreGames) {
          setGameSearchTotal(gameSearchPage * 20);
        }

      } catch (error) {
        console.error("Erro ao carregar mais resultados de pesquisa", error);
      } finally {
        setLoadingMore(false);
      }
    } else {
      if (trendingPage >= trendingTotalPages) return;
      const nextPage = trendingPage + 1;
      setLoadingMore(true);

      try {
        const response = await fetch(`/api/tmdb/trending?page=${nextPage}`);
        if (response.ok) {
          const data = (await response.json()) as PaginatedMedia;
          setTrendingItems((prev) =>
            appendUniqueMedia(prev, data.results || []),
          );
          setTrendingPage(nextPage);
          setTrendingTotalPages(data.totalPages || nextPage);
        }
      } catch (error) {
        console.error("Erro ao carregar mais produções em alta", error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [
    loadingMore,
    isSearching,
    isSearchActive,
    searchPage,
    searchTotalPages,
    gameSearchPage,
    gameSearchTotal,
    normalizedQuery,
    trendingPage,
    trendingTotalPages,
  ]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const displayedItems = isSearchActive ? results : trendingItems;
  const hasSearchResults = results.length > 0 || gameResults.length > 0;
  const hasMore = isSearchActive
    ? searchPage < searchTotalPages || gameSearchPage * 20 < gameSearchTotal
    : trendingPage < trendingTotalPages;

  const featuredBackdrop = displayedItems.find((item) => Boolean(item.backdropPath))?.backdropPath;
  const backdropUrl = featuredBackdrop ? getTMDBImageUrl(featuredBackdrop, "original") : null;

  return (
    <>
      <FixedBackdrop backdropUrl={backdropUrl} activeId={backdropUrl ?? "search"} fullBlur />
      <div className="search-screen-container">
      {/* Search Input Bar on Top */}
      <div className="search-top-bar">
        <div className="search-input-wrapper">
          <Search className="search-bar-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="search-main-input"
            placeholder="Pesquisar filmes, séries e games..."
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              setPendingSearch(value.trim().length >= 2);
            }}
            aria-label="Pesquisar filmes, séries e games"
          />
          {isSearching && (
            <LoaderCircle
              className="search-bar-loading animate-spin"
              size={18}
            />
          )}
          {!isSearching && query && (
            <button
              type="button"
              className="search-bar-clear"
              onClick={() => {
                setQuery("");
                setPendingSearch(false);
                inputRef.current?.focus();
              }}
              aria-label="Limpar pesquisa"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Heading */}
      <div className="search-results-heading">
        <h1 className="search-section-title">
          {isSearchActive
            ? isSearching
              ? `Pesquisando por "${query}"...`
              : hasSearchResults
                ? `Resultados para "${query}"`
                : `Nenhum resultado para "${query}"`
            : "Principais pesquisas"}
        </h1>
        {!isSearchActive && (
          <p className="search-section-subtitle">
            Filmes, séries e produções mais populares em alta no momento
          </p>
        )}
      </div>

      {/* Content Grid */}
      {(isSearchActive ? hasSearchResults : displayedItems.length > 0) ? (
        <>
          {displayedItems.length > 0 && (
            <section className="search-result-group" aria-labelledby="media-results-title">
              {isSearchActive && <h2 id="media-results-title">Filmes e séries</h2>}
              <div className="search-media-grid">
                {displayedItems.map((item) => (
                  <MediaCard
                    key={`${item.mediaType}-${item.id}`}
                    item={item}
                    showQuickActions
                  />
                ))}
              </div>
            </section>
          )}

          {isSearchActive && gameResults.length > 0 && (
            <section className="search-result-group" aria-labelledby="game-results-title">
              <h2 id="game-results-title">Games</h2>
              <div className="search-media-grid">
                {gameResults.map((game) => <GameCard key={game.id} game={game} />)}
              </div>
            </section>
          )}

          {/* Infinite Scroll Sentinel & Loader */}
          {hasMore && <div ref={sentinelRef} className="search-sentinel" />}

          {loadingMore && (
            <div className="search-scroll-loader">
              <LoaderCircle className="animate-spin" size={20} />
              <span>Carregando mais títulos...</span>
            </div>
          )}
        </>
      ) : isSearchActive && !isSearching ? (
        <div className="search-empty-state">
          <p className="search-empty-title">Nenhum título encontrado</p>
          <p className="search-empty-text">
            Tente buscar por outro título, autor, ISBN ou palavra-chave.
          </p>
        </div>
      ) : null}
    </div>
    </>
  );
}
