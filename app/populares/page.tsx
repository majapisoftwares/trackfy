import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import {
  getPopularMoviesPage,
  getPopularTVShowsPage,
  getTrendingAllPage,
} from "@/src/lib/tmdb/endpoints";

type PopularPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PopularPage({
  searchParams,
}: PopularPageProps) {
  const { page, filters, values } = parseCatalogSearchParams(await searchParams);
  const data =
    filters.mediaType === "movie"
      ? await getPopularMoviesPage(page, filters)
      : filters.mediaType === "tv"
        ? await getPopularTVShowsPage(page, filters)
        : await getTrendingAllPage(page, filters);

  return (
    <CatalogPage
      title="Populares"
      subtitle="As produções mais assistidas e comentadas do momento em todo o mundo."
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
      showMediaTypeFilter
    />
  );
}
