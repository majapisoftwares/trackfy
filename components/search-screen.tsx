"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, LoaderCircle } from "lucide-react";
import type { MediaItem, PaginatedMedia } from "@/src/lib/tmdb/types";
import { MediaCard } from "./media-card";
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
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [, setSearched] = useState(false);

  const [trendingItems, setTrendingItems] = useState<MediaItem[]>(initialMedia);
  const [trendingPage, setTrendingPage] = useState(1);
  const [trendingTotalPages, setTrendingTotalPages] = useState(initialTotalPages);

  const [loadingMore, setLoadingMore] = useState(false);

  const normalizedQuery = query.trim();
  const isSearchActive = normalizedQuery.length >= 2;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (initialMedia.length > 0) {
      setTrendingItems(initialMedia);
      setTrendingTotalPages(initialTotalPages);
    }
  }, [initialMedia, initialTotalPages]);

  useEffect(() => {
    if (!isSearchActive) {
      setResults([]);
      setLoadingSearch(false);
      setSearched(false);
      setSearchPage(1);
      setSearchTotalPages(1);
      return;
    }

    const controller = new AbortController();
    setLoadingSearch(true);

    const timeout = window.setTimeout(async () => {
      try {
        const searchParams = new URLSearchParams({
          query: normalizedQuery,
          page: "1",
        });
        const response = await fetch(`/api/tmdb/search?${searchParams}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Falha na pesquisa");

        const data = (await response.json()) as PaginatedMedia;
        setResults(data.results || []);
        setSearchPage(data.page || 1);
        setSearchTotalPages(data.totalPages || 1);
        setSearched(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSearch(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery, isSearchActive]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loadingSearch) return;

    if (isSearchActive) {
      if (searchPage >= searchTotalPages) return;
      const nextPage = searchPage + 1;
      setLoadingMore(true);

      try {
        const searchParams = new URLSearchParams({
          query: normalizedQuery,
          page: String(nextPage),
        });
        const response = await fetch(`/api/tmdb/search?${searchParams}`);
        if (response.ok) {
          const data = (await response.json()) as PaginatedMedia;
          setResults((prev) => appendUniqueMedia(prev, data.results || []));
          setSearchPage(nextPage);
          setSearchTotalPages(data.totalPages || nextPage);
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
    loadingSearch,
    isSearchActive,
    searchPage,
    searchTotalPages,
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
  const hasMore = isSearchActive
    ? searchPage < searchTotalPages
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
            placeholder="Pesquisar séries e filmes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Pesquisar séries e filmes"
          />
          {loadingSearch && (
            <LoaderCircle
              className="search-bar-loading animate-spin"
              size={18}
            />
          )}
          {!loadingSearch && query && (
            <button
              type="button"
              className="search-bar-clear"
              onClick={() => {
                setQuery("");
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
            ? loadingSearch
              ? `Pesquisando por "${query}"...`
              : results.length > 0
                ? `Resultados para "${query}"`
                : `Nenhum resultado para "${query}"`
            : "Principais pesquisas"}
        </h1>
        {!isSearchActive && (
          <p className="search-section-subtitle">
            Os conteúdos e produções mais populares em alta no momento
          </p>
        )}
      </div>

      {/* Content Grid */}
      {displayedItems.length > 0 ? (
        <>
          <div className="search-media-grid">
            {displayedItems.map((item) => (
              <MediaCard
                key={`${item.mediaType}-${item.id}`}
                item={item}
                showQuickActions
              />
            ))}
          </div>

          {/* Infinite Scroll Sentinel & Loader */}
          {hasMore && <div ref={sentinelRef} className="search-sentinel" />}

          {loadingMore && (
            <div className="search-scroll-loader">
              <LoaderCircle className="animate-spin" size={20} />
              <span>Carregando mais títulos...</span>
            </div>
          )}
        </>
      ) : isSearchActive && !loadingSearch ? (
        <div className="search-empty-state">
          <p className="search-empty-title">Nenhum título encontrado</p>
          <p className="search-empty-text">
            Tente buscar com outras palavras-chave, título original ou nome de
            atores.
          </p>
        </div>
      ) : null}
    </div>
    </>
  );
}
