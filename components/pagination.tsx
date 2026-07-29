import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
};

function pageHref(
  page: number,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `?${value}` : "?";
}

export function Pagination({
  currentPage,
  totalPages,
  query = {},
}: PaginationProps) {
  const lastPage = Math.max(1, Math.min(totalPages, 500));
  const pages = Array.from(
    new Set(
      [1, currentPage - 1, currentPage, currentPage + 1, lastPage].filter(
        (page) => page >= 1 && page <= lastPage,
      ),
    ),
  ).sort((a, b) => a - b);

  return (
    <nav className="catalog-pagination" aria-label="Paginação do catálogo">
      {currentPage > 1 ? (
        <Link
          className="page-button"
          href={pageHref(currentPage - 1, query)}
          aria-label="Página anterior"
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </Link>
      ) : (
        <span className="page-button disabled" aria-hidden="true">
          <ChevronLeft size={16} />
        </span>
      )}
      {pages.map((page, index) => (
        <span className="page-item" key={page}>
          {index > 0 && pages[index - 1] < page - 1 && (
            <span className="page-ellipsis">…</span>
          )}
          <Link
            className={`page-button ${page === currentPage ? "active" : ""}`}
            href={pageHref(page, query)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        </span>
      ))}
      {currentPage < lastPage ? (
        <Link
          className="page-button"
          href={pageHref(currentPage + 1, query)}
          aria-label="Próxima página"
        >
          <ChevronRight aria-hidden="true" size={16} />
        </Link>
      ) : (
        <span className="page-button disabled" aria-hidden="true">
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
