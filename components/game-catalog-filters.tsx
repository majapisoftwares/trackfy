"use client";

import { Check, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RawgNamedItem } from "@/src/lib/rawg/types";
import { Drawer } from "./interior/drawer";

const PLATFORMS = [{ value: "4", label: "PC" }, { value: "187", label: "PlayStation 5" }, { value: "18", label: "PlayStation 4" }, { value: "1", label: "Xbox One" }, { value: "7", label: "Nintendo Switch" }];
export type GameCatalogFilterValues = { search?: string; genre?: string; platform?: string; year?: string; rating?: string };

export function GameCatalogFilters({ values, genres }: { values: GameCatalogFilterValues; genres: RawgNamedItem[] }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const [open, setOpen] = useState(false); const [search, setSearch] = useState(values.search ?? ""); const [genre, setGenre] = useState(values.genre ?? ""); const [platform, setPlatform] = useState(values.platform ?? ""); const [year, setYear] = useState(values.year ?? ""); const [rating, setRating] = useState(values.rating ?? "");
  const active = Boolean(search || genre || platform || year || rating);
  const apply = () => { const params = new URLSearchParams(searchParams.toString()); const next = { gameSearch: search.trim(), gameGenre: genre, gamePlatform: platform, gameYear: year, gameRating: rating }; Object.entries(next).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key)); params.set("mediaType", "game"); params.delete("page"); router.push(`${pathname}?${params}`); setOpen(false); };
  const reset = () => { setSearch(""); setGenre(""); setPlatform(""); setYear(""); setRating(""); };
  return <><button type="button" onClick={() => setOpen(true)} className={`catalog-filter-btn ${active ? "has-active" : ""}`} aria-label="Abrir filtros de games" aria-expanded={open}><SlidersHorizontal size={16} /><span>Filtros</span>{active && <span className="catalog-filter-badge">1</span>}</button><Drawer open={open} onOpenChange={setOpen} title="Filtros" description="Refine os resultados de games" width={420}><div className="filter-drawer-content game-filter-drawer"><label>Buscar jogos<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome do jogo" /></label><label>Gênero<select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="">Todos os gêneros</option>{genres.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label>Plataforma<select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="">Todas as plataformas</option>{PLATFORMS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Ano<select value={year} onChange={(event) => setYear(event.target.value)}><option value="">Qualquer ano</option>{Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() - index)).map((item) => <option key={item}>{item}</option>)}</select></label><label>Avaliação<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="">Qualquer avaliação</option><option value="75,100">Metacritic 75+</option><option value="85,100">Metacritic 85+</option></select></label></div><div className="filter-drawer-footer"><button type="button" onClick={reset} disabled={!active} className="filter-drawer-reset"><RotateCcw size={14} />Limpar</button><button type="button" onClick={apply} className="filter-drawer-apply"><Check size={16} />Aplicar filtros</button></div></Drawer></>;
}
