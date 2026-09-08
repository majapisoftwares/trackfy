import { CatalogPage } from "@/components/catalog-page";
import { JikanAnimeCatalog } from "@/components/jikan-anime-catalog";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";

type AnimePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PopularAnimePage({
  searchParams,
}: AnimePageProps) {
  const { page, values } = parseCatalogSearchParams(
    await searchParams,
  );
  return (
    <CatalogPage
      title="Animes populares"
      subtitle="Ranking de animes mais bem avaliados pela comunidade MyAnimeList."
      items={[]}
      currentPage={page}
      totalPages={1}
      filters={values}
      showFilters={false}
      content={<JikanAnimeCatalog key={page} page={page} />}
    />
  );
}
