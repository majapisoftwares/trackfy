import { cookies } from "next/headers";
import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { TRACKING_COOKIE_NAME, isTrackingOwnerId } from "@/src/lib/tracking/session";
import { getArchivedMediaPage } from "@/src/lib/tracking/saved-media";

type ArchivedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivedPage({ searchParams }: ArchivedPageProps) {
  const { page } = parseCatalogSearchParams(await searchParams);
  const cookieStore = await cookies();
  const ownerId = cookieStore.get(TRACKING_COOKIE_NAME)?.value;
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
  const data = user && isTrackingOwnerId(ownerId)
    ? await getArchivedMediaPage(ownerId, page, {})
    : { page: 1, results: [], totalPages: 1 };

  return (
    <CatalogPage
      title="Arquivados"
      subtitle="Conteúdos finalizados ou que você arquivou para assistir depois"
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      showFilters={false}
    />
  );
}
