import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import {
  getPopularMoviesPage,
  getPopularAllPage,
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

  const tabHref = (mediaType?: "movie" | "tv") => {
    const params = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
      if (value && key !== "mediaType") params.set(key, value);
    });
    if (mediaType) params.set("mediaType", mediaType);

    const query = params.toString();
    return query ? `/populares?${query}` : "/populares";
  };

  const data =
    filters.mediaType === "movie"
      ? await getPopularMoviesPage(page, filters)
      : filters.mediaType === "tv"
        ? await getPopularTVShowsPage(page, filters)
        : filters.sort
          ? await getPopularAllPage(page, filters)
          : await getTrendingAllPage(page, filters);

  return (
    <CatalogPage
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
      showAdvancedFilters={true}
      showQuickActions
      infiniteScroll={true}
      fullBlur
      tabs={[
        { label: "Todos", href: tabHref(undefined), active: !filters.mediaType },
        { label: "Filmes", href: tabHref("movie"), active: filters.mediaType === "movie" },
        { label: "Programas de TV", href: tabHref("tv"), active: filters.mediaType === "tv" },
      ]}
    />
  );
}
