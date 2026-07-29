import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { getPopularTVShowsPage } from "@/src/lib/tmdb/endpoints";

type SeriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PopularSeriesPage({
  searchParams,
}: SeriesPageProps) {
  const { page, filters, values } = parseCatalogSearchParams(
    await searchParams,
  );
  const data = await getPopularTVShowsPage(page, filters);

  return (
    <CatalogPage
      title="Séries populares"
      subtitle="As séries mais assistidas e comentadas do momento em todo o mundo."
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
    />
  );
}
