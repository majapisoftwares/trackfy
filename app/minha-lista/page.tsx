import { cookies } from "next/headers";
import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { TRACKING_COOKIE_NAME, isTrackingOwnerId } from "@/src/lib/tracking/session";
import { getSavedMediaPage } from "@/src/lib/tracking/saved-media";
import { CustomListsManager } from "@/components/custom-lists-manager";
import { ImdbImportButton } from "@/components/imdb-import-button";
import { findCustomList } from "@/src/lib/tracking/custom-lists";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { listUserGames } from "@/src/lib/games/repository";
import { GameLibrarySection } from "@/components/game-library-section";

type MyListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyListPage({ searchParams }: MyListPageProps) {
  const params = await searchParams;
  const { page } = parseCatalogSearchParams(params);
  const ownerId = (await cookies()).get(TRACKING_COOKIE_NAME)?.value;
  const authToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
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
      headerAction={!selectedList ? <ImdbImportButton /> : undefined}
      aboveGrid={
        <>
          <CustomListsManager selectedListId={selectedListId} />
          <GameLibrarySection items={user ? await listUserGames(user.ownerId) : []} />
          <div className="catalog-heading media-library-heading">
            <h2>Filmes e séries</h2>
            <p>{selectedList ? "Conteúdos desta lista" : "Filmes e séries que você salvou para assistir"}</p>
          </div>
        </>
      }
    />
  );
}
