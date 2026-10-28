"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameItem, GamePage, RawgNamedItem } from "@/src/lib/rawg/types";
import { GameCard } from "./game-card";
import type { GameCatalogFilterValues } from "./game-catalog-filters";

const PLATFORMS = [{ value: "4", label: "PC" }, { value: "187", label: "PlayStation 5" }, { value: "18", label: "PlayStation 4" }, { value: "1", label: "Xbox One" }, { value: "7", label: "Nintendo Switch" }];

export function GamesCatalog({ initialItems, genres, embedded = false, initialPage = 1, initialTotal = initialItems.length, initialFilters = {}, pageSize = 20 }: { initialItems: GameItem[]; genres: RawgNamedItem[]; embedded?: boolean; initialPage?: number; initialTotal?: number; initialFilters?: GameCatalogFilterValues; pageSize?: number }) {
  const [items, setItems] = useState(initialItems); const [search, setSearch] = useState(initialFilters.search ?? "");
  const [genre, setGenre] = useState(initialFilters.genre ?? ""); const [platform, setPlatform] = useState(initialFilters.platform ?? ""); const [year, setYear] = useState(initialFilters.year ?? ""); const [rating, setRating] = useState(initialFilters.rating ?? "");
  const [page, setPage] = useState(initialPage); const [loading, setLoading] = useState(false); const [error, setError] = useState(false); const [hasMore, setHasMore] = useState(initialPage * pageSize < initialTotal);
  const sentinelRef = useRef<HTMLDivElement>(null); const fetchingRef = useRef(false);
  const request = useCallback(async (nextPage: number) => {
    setLoading(true); setError(false);
    try {
      const params = new URLSearchParams({ page: String(nextPage), pageSize: String(pageSize), ordering: "-added" });
      if (search.trim()) params.set("search", search.trim()); if (genre) params.set("genres", genre); if (platform) params.set("platforms", platform);
      if (year) params.set("dates", `${year}-01-01,${year}-12-31`); if (rating) params.set("metacritic", rating);
      const response = await fetch(`/api/games?${params}`); if (!response.ok) throw new Error("GAMES_REQUEST_FAILED");
      const data = await response.json() as GamePage; setItems(data.results); setPage(data.page); setHasMore(data.page * data.pageSize < data.count);
    } catch { setError(true); setItems([]); } finally { setLoading(false); }
  }, [genre, pageSize, platform, rating, search, year]);
  useEffect(() => { if (embedded) return; const timer = window.setTimeout(() => void request(1), 350); return () => window.clearTimeout(timer); }, [embedded, request]);
  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore || loading) return;
    fetchingRef.current = true; setLoading(true);
    try {
      const nextPage = page + 1; const params = new URLSearchParams({ page: String(nextPage), pageSize: String(pageSize), ordering: "-added" });
      if (search.trim()) params.set("search", search.trim()); if (genre) params.set("genres", genre); if (platform) params.set("platforms", platform);
      if (year) params.set("dates", `${year}-01-01,${year}-12-31`); if (rating) params.set("metacritic", rating);
      const response = await fetch(`/api/games?${params}`); if (!response.ok) throw new Error("GAMES_REQUEST_FAILED");
      const data = await response.json() as GamePage;
      setItems((current) => { const ids = new Set(current.map((item) => item.id)); return [...current, ...data.results.filter((item) => !ids.has(item.id))]; });
      setPage(data.page); setHasMore(data.page * data.pageSize < data.count);
    } catch { setError(true); setHasMore(false); } finally { setLoading(false); fetchingRef.current = false; }
  }, [genre, hasMore, loading, page, pageSize, platform, rating, search, year]);
  useEffect(() => { const sentinel = sentinelRef.current; if (!sentinel || !hasMore) return; const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) void loadMore(); }, { rootMargin: "400px" }); observer.observe(sentinel); return () => observer.disconnect(); }, [hasMore, loadMore]);
  return <section className={`games-catalog ${embedded ? "" : "container"}`} id="explorar">
    {!embedded && <div className="catalog-toolbar"><header className="catalog-heading"><h1>Explorar jogos</h1><p>Encontre seu próximo mundo para descobrir</p></header></div>}
    {!embedded && <div className="games-filter-bar" aria-label="Filtros de jogos">
      <label className="games-search"><Search size={17} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar jogos" aria-label="Buscar jogos" /></label>
      <select value={genre} onChange={(event) => setGenre(event.target.value)} aria-label="Filtrar por gênero"><option value="">Todos os gêneros</option>{genres.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>
      <select value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Filtrar por plataforma"><option value="">Todas as plataformas</option>{PLATFORMS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Filtrar por ano"><option value="">Qualquer ano</option>{Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i)).map((item) => <option key={item}>{item}</option>)}</select>
      <select value={rating} onChange={(event) => setRating(event.target.value)} aria-label="Filtrar por Metacritic"><option value="">Qualquer avaliação</option><option value="75,100">Metacritic 75+</option><option value="85,100">Metacritic 85+</option></select>
    </div>}
    {loading ? <div className="games-loading"><LoaderCircle className="animate-spin" size={20} /> Carregando jogos...</div> : error ? <p className="section-empty">Não foi possível carregar os jogos. Tente novamente.</p> : items.length ? <div className="catalog-grid">{items.map((game) => <GameCard key={game.id} game={game} />)}</div> : <p className="section-empty">Nenhum jogo encontrado com estes critérios.</p>}
    {hasMore && <div ref={sentinelRef} className="infinite-scroll-sentinel">{loading && <div className="infinite-scroll-loader"><LoaderCircle className="animate-spin" size={24} aria-hidden="true" /><span>Carregando mais jogos...</span></div>}</div>}
  </section>;
}
