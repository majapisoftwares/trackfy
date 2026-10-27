import type { MediaItem } from "@/src/lib/tmdb/types";
import Link from "next/link";
import type { ReactNode } from "react";
import { CatalogFilters } from "./catalog-filters";
import { Footer } from "./footer";
import { DashboardShell } from "./dashboard-shell";
import { MediaCard } from "./media-card";
import { Pagination } from "./pagination";
import { InfiniteCatalogGrid } from "./infinite-catalog-grid";
import { FixedBackdrop } from "./fixed-backdrop";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";

type CatalogPageProps = {
  title?: string;
  subtitle?: string;
  items: MediaItem[];
  currentPage: number;
  totalPages: number;
  filters?: Record<string, string | undefined>;
  showFilters?: boolean;
  showMediaTypeFilter?: boolean;
  showStreamingFilter?: boolean;
  showAdvancedFilters?: boolean;
  showQuickActions?: boolean;
  tabs?: Array<{ label: string; href: string; active: boolean }>;
  tabAction?: ReactNode;
  headerAction?: ReactNode;
  aboveGrid?: ReactNode;
  content?: ReactNode;
  infiniteScroll?: boolean;
  apiEndpoint?: string;
  fullBlur?: boolean;
  paginationActiveTone?: "default" | "light";
};

export function CatalogPage({
  title,
  subtitle,
  items,
  currentPage,
  totalPages,
  filters = {},
  showFilters = true,
  showMediaTypeFilter = false,
  showStreamingFilter = false,
  showAdvancedFilters = true,
  showQuickActions = false,
  tabs,
  tabAction,
  headerAction,
  aboveGrid,
  content,
  infiniteScroll = false,
  apiEndpoint,
  fullBlur = false,
  paginationActiveTone = "default",
}: CatalogPageProps) {
  const infiniteKey = `${filters.mediaType ?? ""}-${filters.genre ?? ""}-${filters.sort ?? ""}-${filters.streaming ?? ""}-${currentPage}`;
  const featuredBackdrop = items.find((item) => Boolean(item.backdropPath))?.backdropPath;
  const backdropUrl = featuredBackdrop ? getTMDBImageUrl(featuredBackdrop, "original") : null;

  return (
    <>
      <FixedBackdrop
        backdropUrl={backdropUrl}
        activeId={backdropUrl ?? "catalog"}
        fullBlur={fullBlur}
      />
      <DashboardShell>
        <div className="catalog-shell">
          <section className="catalog-page container">
            {tabs ? (
              <div className="catalog-toolbar">
                <nav className="catalog-tabs" aria-label="Tipo de conteúdo">
                  {tabs.map((tab) => (
                    <Link
                      aria-current={tab.active ? "page" : undefined}
                      className={tab.active ? "active" : undefined}
                      href={tab.href}
                      key={tab.label}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </nav>
                {tabAction}
                {showFilters && (
                  <CatalogFilters
                    values={filters}
                    showMediaTypeFilter={showMediaTypeFilter}
                    showStreamingFilter={showStreamingFilter}
                    showAdvancedFilters={showAdvancedFilters}
                  />
                )}
              </div>
            ) : title ? (
              <div className="catalog-toolbar">
                <header className="catalog-heading">
                  <h1>{title}</h1>
                  {subtitle && <p>{subtitle}</p>}
                </header>
                {headerAction}
                {showFilters && (
                  <CatalogFilters
                    values={filters}
                    showMediaTypeFilter={showMediaTypeFilter}
                    showStreamingFilter={showStreamingFilter}
                    showAdvancedFilters={showAdvancedFilters}
                  />
                )}
              </div>
            ) : showFilters ? (
              <div className="catalog-toolbar catalog-toolbar-end">
                <CatalogFilters
                  values={filters}
                  showMediaTypeFilter={showMediaTypeFilter}
                  showStreamingFilter={showStreamingFilter}
                  showAdvancedFilters={showAdvancedFilters}
                />
              </div>
            ) : null}

            {aboveGrid}

            {content ?? (infiniteScroll ? (
              <InfiniteCatalogGrid
                key={infiniteKey}
                initialItems={items}
                initialPage={currentPage}
                totalPages={totalPages}
                filters={filters}
                showQuickActions={showQuickActions}
                apiEndpoint={apiEndpoint}
              />
            ) : (
              <>
                {items.length > 0 ? (
                  <div className="catalog-grid">
                    {items.map((item) => (
                      <MediaCard
                        item={item}
                        key={`${item.mediaType}-${item.id}`}
                        showQuickActions={showQuickActions}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="section-empty">
                    Nenhum título encontrado com estes critérios.
                  </p>
                )}

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  query={filters}
                  activeTone={paginationActiveTone}
                />
              </>
            ))}
          </section>
        </div>
      </DashboardShell>
      <Footer />
    </>
  );
}
