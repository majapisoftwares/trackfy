import { cookies } from "next/headers";
import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { TRACKING_COOKIE_NAME, isTrackingOwnerId } from "@/src/lib/tracking/session";
import { getSavedMediaPage } from "@/src/lib/tracking/saved-media";

type MyListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyListPage({ searchParams }: MyListPageProps) {
  const { page, filters, values } = parseCatalogSearchParams(await searchParams);
  const ownerId = (await cookies()).get(TRACKING_COOKIE_NAME)?.value;
  const data = isTrackingOwnerId(ownerId)
    ? await getSavedMediaPage(ownerId, page, filters)
    : { page: 1, results: [], totalPages: 1 };

  return (
    <CatalogPage
      title="Sua lista"
      subtitle="Conteúdos que você salvou para assistir"
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
      showMediaTypeFilter
    />
  );
}
