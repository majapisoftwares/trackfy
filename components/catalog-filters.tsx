"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  RotateCcw,
  Check,
  Film,
  Tv,
  Layers,
} from "lucide-react";
import { Drawer } from "./interior/drawer";
import { STREAMING_PROVIDERS } from "@/src/lib/streaming";

type CatalogFiltersProps = {
  values: Record<string, string | undefined>;
  showMediaTypeFilter?: boolean;
  showAdvancedFilters?: boolean;
  showStreamingFilter?: boolean;
};

const SORT_OPTIONS = [
  { id: "popularity.desc", label: "Mais populares" },
  { id: "date.desc", label: "Mais recentes" },
  { id: "vote_average.desc", label: "Melhores avaliados" },
];

const MEDIA_TYPES = [
  { id: "", label: "Todos", icon: Layers },
  { id: "movie", label: "Filmes", icon: Film },
  { id: "tv", label: "Séries", icon: Tv },
];

const GENRES = [
  { id: "28", label: "Ação" },
  { id: "12", label: "Aventura" },
  { id: "35", label: "Comédia" },
  { id: "18", label: "Drama" },
  { id: "27", label: "Terror" },
  { id: "878", label: "Ficção científica" },
  { id: "16", label: "Animação" },
  { id: "80", label: "Crime" },
  { id: "99", label: "Documentário" },
  { id: "14", label: "Fantasia" },
  { id: "9648", label: "Mistério" },
  { id: "10749", label: "Romance" },
  { id: "53", label: "Suspense" },
];

const STREAMING_OPTIONS = Object.values(STREAMING_PROVIDERS).map((provider) => ({
  id: String(provider.tmdbProviderId),
  label: provider.name,
}));

type DrawerBodyProps = {
  initialValues: Record<string, string | undefined>;
  showMediaTypeFilter: boolean;
  showStreamingFilter: boolean;
  onApply: (applied: {
    sort: string;
    genre: string;
    mediaType: string;
    streaming: string;
  }) => void;
  onClose: () => void;
};

function CatalogFiltersDrawerBody({
  initialValues,
  showMediaTypeFilter,
  showStreamingFilter,
  onApply,
}: DrawerBodyProps) {
  const [selectedSort, setSelectedSort] = useState(initialValues.sort ?? "popularity.desc");
  const [selectedGenre, setSelectedGenre] = useState(initialValues.genre ?? "");
  const [selectedMediaType, setSelectedMediaType] = useState(initialValues.mediaType ?? "");
  const [selectedStreaming, setSelectedStreaming] = useState(initialValues.streaming ?? "");

  const handleReset = () => {
    setSelectedSort("popularity.desc");
    setSelectedGenre("");
    setSelectedMediaType("");
    setSelectedStreaming("");
  };

  const handleApplyClick = () => {
    onApply({
      sort: selectedSort,
      genre: selectedGenre,
      mediaType: selectedMediaType,
      streaming: selectedStreaming,
    });
  };

  const hasActiveFilters = Boolean(
    (selectedSort && selectedSort !== "popularity.desc") ||
    Boolean(selectedGenre) ||
    (showStreamingFilter && Boolean(selectedStreaming)) ||
    (showMediaTypeFilter && Boolean(selectedMediaType))
  );

  return (
    <>
      <div className="filter-drawer-content">
        {/* Ordenar por */}
        <section className="filter-section">
          <h3 className="filter-section-title">
            Ordenar por:
          </h3>
          <div className="filter-pills-grid">
            {SORT_OPTIONS.map(({ id, label }) => {
              const isActive = selectedSort === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedSort(id)}
                  className={`filter-pill ${isActive ? "active" : ""}`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tipo de mídia (se habilitado) */}
        {showMediaTypeFilter && (
          <section className="filter-section">
            <h3 className="filter-section-title">Tipo de Conteúdo</h3>
            <div className="filter-pills-row">
              {MEDIA_TYPES.map(({ id, label, icon: Icon }) => {
                const isActive = selectedMediaType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedMediaType(id)}
                    className={`filter-pill ${isActive ? "active" : ""}`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Gêneros */}
        <section className="filter-section">
          <div className="flex items-center justify-between mb-2">
            <h3 className="filter-section-title" style={{ margin: 0 }}>Gêneros</h3>
            {selectedGenre && (
              <button
                type="button"
                onClick={() => setSelectedGenre("")}
                className="filter-clear-link"
              >
                Desmarcar
              </button>
            )}
          </div>
          <div className="filter-chips-wrap">
            {GENRES.map(({ id, label }) => {
              const isActive = selectedGenre === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedGenre(isActive ? "" : id)}
                  className={`filter-chip ${isActive ? "active" : ""}`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {showStreamingFilter && <section className="filter-section">
          <div className="flex items-center justify-between mb-2">
            <h3 className="filter-section-title" style={{ margin: 0 }}>Streaming</h3>
            {selectedStreaming && (
              <button
                type="button"
                onClick={() => setSelectedStreaming("")}
                className="filter-clear-link"
              >
                Desmarcar
              </button>
            )}
          </div>
          <div className="filter-chips-wrap">
            {STREAMING_OPTIONS.map(({ id, label }) => {
              const isActive = selectedStreaming === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedStreaming(isActive ? "" : id)}
                  className={`filter-chip ${isActive ? "active" : ""}`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>}
      </div>

      <div className="filter-drawer-footer">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasActiveFilters}
          className="filter-drawer-reset"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Limpar</span>
        </button>
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={!hasActiveFilters}
          className="filter-drawer-apply"
        >
          <Check size={16} aria-hidden="true" />
          <span>Aplicar Filtros</span>
        </button>
      </div>
    </>
  );
}

export function CatalogFilters({
  values,
  showMediaTypeFilter = false,
  showStreamingFilter = false,
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);

  // Count active non-default filters
  const activeCount = [
    values.sort && values.sort !== "popularity.desc",
    Boolean(values.genre),
    showStreamingFilter && Boolean(values.streaming),
    showMediaTypeFilter && Boolean(values.mediaType),
  ].filter(Boolean).length;

  const handleApply = (applied: {
    sort: string;
    genre: string;
    mediaType: string;
    streaming: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove filter params
    if (applied.sort && applied.sort !== "popularity.desc") {
      params.set("sort", applied.sort);
    } else {
      params.delete("sort");
    }

    if (applied.genre) {
      params.set("genre", applied.genre);
    } else {
      params.delete("genre");
    }

    if (showStreamingFilter && applied.streaming) {
      params.set("streaming", applied.streaming);
    } else {
      params.delete("streaming");
    }

    if (showMediaTypeFilter) {
      if (applied.mediaType) {
        params.set("mediaType", applied.mediaType);
      } else {
        params.delete("mediaType");
      }
    }

    // Always clean up removed filters
    params.delete("year");
    params.delete("language");
    params.delete("rating");

    // Reset pagination to page 1 on applying new filters
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  };

  const key = `${open}-${values.sort}-${values.genre}-${values.mediaType}-${values.streaming}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`catalog-filter-btn ${activeCount > 0 ? "has-active" : ""}`}
        aria-label="Abrir filtros"
        aria-expanded={open}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="catalog-filter-badge">{activeCount}</span>
        )}
      </button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Filtros"
        description="Refine os resultados do catálogo"
        width={420}
      >
        <CatalogFiltersDrawerBody
          key={key}
          initialValues={values}
          showMediaTypeFilter={showMediaTypeFilter}
          showStreamingFilter={showStreamingFilter}
          onApply={handleApply}
          onClose={() => setOpen(false)}
        />
      </Drawer>
    </>
  );
}
