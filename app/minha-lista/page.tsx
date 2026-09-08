import { cookies } from "next/headers";
import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { TRACKING_COOKIE_NAME, isTrackingOwnerId } from "@/src/lib/tracking/session";
import { getSavedMediaPage } from "@/src/lib/tracking/saved-media";
import { CustomListsManager } from "@/components/custom-lists-manager";
import { findCustomList } from "@/src/lib/tracking/custom-lists";
import type { MediaItem } from "@/src/lib/tmdb/types";

type MyListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyListPage({ searchParams }: MyListPageProps) {
  const params = await searchParams;
  const { page } = parseCatalogSearchParams(params);
  const ownerId = (await cookies()).get(TRACKING_COOKIE_NAME)?.value;
  const selectedListId = typeof params.list === "string" ? params.list : undefined;
  const selectedList = ownerId && selectedListId
    ? await findCustomList(ownerId, selectedListId)
    : null;
  const customItems: MediaItem[] = selectedList?.items.map((item) => ({
    id: item.mediaId,
    mediaType: item.mediaType,
    title: item.title,
    posterUrl: item.posterUrl,
    posterPath: null,
    backdropPath: null,
    overview: "",
    releaseDate: null,
    year: null,
    voteAverage: 0,
    voteCount: 0,
    popularity: 0,
    genreIds: [],
    adult: false,
  })) ?? [];
  const data = !selectedList && isTrackingOwnerId(ownerId)
    ? await getSavedMediaPage(ownerId, page, {})
    : { page: 1, results: customItems, totalPages: 1 };

  return (
    <CatalogPage
      title={selectedList?.name ?? "Sua lista"}
      subtitle={selectedList ? "Conteúdos desta lista" : "Conteúdos que você salvou para assistir"}
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      showFilters={false}
      fullBlur
      paginationActiveTone="light"
      aboveGrid={<CustomListsManager selectedListId={selectedListId} />}
    />
  );
}
