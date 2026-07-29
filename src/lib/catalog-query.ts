import type { CatalogFilters } from "./tmdb/endpoints";

export type CatalogSearchParams = Record<
  string,
  string | string[] | undefined
>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeNumber(
  value: string | string[] | undefined,
  minimum: number,
  maximum: number,
): number | undefined {
  const parsed = Number.parseInt(first(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

export function parseCatalogSearchParams(params: CatalogSearchParams) {
  const page = safeNumber(params.page, 1, 500) ?? 1;
  const values = {
    genre: first(params.genre),
    year: first(params.year),
    rating: first(params.rating),
    language: first(params.language),
    sort: first(params.sort),
    mediaType: first(params.mediaType),
  };
  const filters: CatalogFilters = {
    genre: values.genre,
    year: safeNumber(values.year, 1900, new Date().getFullYear() + 5),
    minRating: safeNumber(values.rating, 0, 10),
    language: values.language,
    sort: values.sort,
    mediaType:
      values.mediaType === "movie" || values.mediaType === "tv"
        ? values.mediaType
        : undefined,
  };

  return { page, values, filters };
}
