import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { getPopularAnimePage } from "@/src/lib/tmdb/endpoints";

type AnimePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PopularAnimePage({
  searchParams,
}: AnimePageProps) {
  const { page, filters, values } = parseCatalogSearchParams(
    await searchParams,
  );
  const data = await getPopularAnimePage(page, filters);

  return (
    <CatalogPage
      title="Animes populares"
      subtitle="Os animes mais assistidos e comentados do momento em todo o mundo."
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
    />
  );
}
