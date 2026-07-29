import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { getPopularMoviesPage } from "@/src/lib/tmdb/endpoints";

type MoviesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PopularMoviesPage({
  searchParams,
}: MoviesPageProps) {
  const { page, filters, values } = parseCatalogSearchParams(
    await searchParams,
  );
  const data = await getPopularMoviesPage(page, filters);

  return (
    <CatalogPage
      title="Filmes populares"
      subtitle="Os filmes mais assistidos e comentados do momento em todo o mundo."
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
    />
  );
}
