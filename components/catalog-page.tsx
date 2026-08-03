import type { MediaItem } from "@/src/lib/tmdb/types";
import { CatalogFilters } from "./catalog-filters";
import { Footer } from "./footer";
import { DashboardShell } from "./dashboard-shell";
import { MediaCard } from "./media-card";
import { Pagination } from "./pagination";

type CatalogPageProps = {
  title: string;
  subtitle: string;
  items: MediaItem[];
  currentPage: number;
  totalPages: number;
  filters?: Record<string, string | undefined>;
  showFilters?: boolean;
  showMediaTypeFilter?: boolean;
  showQuickActions?: boolean;
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
  showQuickActions = false,
}: CatalogPageProps) {
  return (
    <>
      <DashboardShell>
        <div className="catalog-shell">
        <section className="catalog-page container">
          <header className="catalog-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          {showFilters && (
            <CatalogFilters
              values={filters}
              showMediaTypeFilter={showMediaTypeFilter}
            />
          )}
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
          />
        </section>
        </div>
      </DashboardShell>
      <Footer />
    </>
  );
}
