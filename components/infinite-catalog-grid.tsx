"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem, PaginatedMedia } from "@/src/lib/tmdb/types";
import { MediaCard } from "./media-card";
import { Loader2 } from "lucide-react";

type InfiniteCatalogGridProps = {
  initialItems: MediaItem[];
  initialPage: number;
  totalPages: number;
  filters?: Record<string, string | undefined>;
  showQuickActions?: boolean;
  apiEndpoint?: string;
};

export function InfiniteCatalogGrid({
  initialItems,
  initialPage,
  totalPages,
  filters = {},
  showQuickActions = false,
  apiEndpoint = "/api/tmdb/popular",
}: InfiniteCatalogGridProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || loading) return;

    isFetchingRef.current = true;
    setLoading(true);

    const nextPage = page + 1;
    const params = new URLSearchParams();
    params.set("page", nextPage.toString());

    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });

    try {
      const response = await fetch(`${apiEndpoint}?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar mais itens");
      }

      const data: PaginatedMedia = await response.json();

      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => `${i.mediaType}-${i.id}`));
        const newUnique = data.results.filter(
          (i) => !existingIds.has(`${i.mediaType}-${i.id}`),
        );
        return [...prev, ...newUnique];
      });

      setPage(data.page);
      setHasMore(data.page < data.totalPages && data.page < 500);
    } catch (error) {
      console.error("Erro no carregamento infinito", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [apiEndpoint, filters, hasMore, loading, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (items.length === 0) {
    return (
      <p className="section-empty">
        Nenhum título encontrado com estes critérios.
      </p>
    );
  }

  return (
    <>
      <div className="catalog-grid">
        {items.map((item) => (
          <MediaCard
            item={item}
            key={`${item.mediaType}-${item.id}`}
            showQuickActions={showQuickActions}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel">
          {loading && (
            <div className="infinite-scroll-loader">
              <Loader2 className="animate-spin" size={24} aria-hidden="true" />
              <span>Carregando mais títulos...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

