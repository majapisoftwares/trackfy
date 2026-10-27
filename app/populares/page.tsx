import { CatalogPage } from "@/components/catalog-page";
import { GameCatalogFilters } from "@/components/game-catalog-filters";
import { GamesCatalog } from "@/components/games-catalog";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import { getGameGenres, getGamesPage } from "@/src/lib/rawg/endpoints";
import type { GamePage, RawgNamedItem } from "@/src/lib/rawg/types";
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
  const params = await searchParams;
  const { page, filters, values } = parseCatalogSearchParams(params);

  const tabHref = (mediaType?: "movie" | "tv" | "game") => {
    const params = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
      if (value && key !== "mediaType") params.set(key, value);
    });
    if (mediaType) params.set("mediaType", mediaType);

    const query = params.toString();
    return query ? `/populares?${query}` : "/populares";
  };

  if (values.mediaType === "game") {
    const textParam = (name: string, maximum: number) => typeof params[name] === "string" && params[name].trim().length <= maximum ? params[name].trim() : undefined;
    const gameFilters = {
      search: textParam("gameSearch", 100),
      genre: textParam("gameGenre", 150),
      platform: textParam("gamePlatform", 150),
      year: textParam("gameYear", 4),
      rating: textParam("gameRating", 10),
    };
    const dates = gameFilters.year && /^\d{4}$/.test(gameFilters.year) ? `${gameFilters.year}-01-01,${gameFilters.year}-12-31` : undefined;
    const [games, genres] = await Promise.all([
      getGamesPage({ page, pageSize: 20, ordering: "-added", search: gameFilters.search, genres: gameFilters.genre, platforms: gameFilters.platform, dates, metacritic: gameFilters.rating }),
      getGameGenres(),
    ]).catch((): [GamePage, RawgNamedItem[]] => [
      { page: 1, pageSize: 20, count: 0, results: [] },
      [],
    ]);

    return (
      <CatalogPage
        items={[]}
        currentPage={games.page}
        totalPages={1}
        filters={values}
        showFilters={false}
        fullBlur
        tabAction={<GameCatalogFilters values={gameFilters} genres={genres} />}
        tabs={[
          { label: "Todos", href: tabHref(undefined), active: false },
          { label: "Filmes", href: tabHref("movie"), active: false },
          { label: "Programas de TV", href: tabHref("tv"), active: false },
          { label: "Games", href: tabHref("game"), active: true },
        ]}
        content={<GamesCatalog key={JSON.stringify(gameFilters)} initialItems={games.results} genres={genres} embedded initialPage={games.page} initialTotal={games.count} initialFilters={gameFilters} />}
      />
    );
  }

  const data =
    filters.mediaType === "movie"
      ? await getPopularMoviesPage(page, filters)
      : filters.mediaType === "tv"
        ? await getPopularTVShowsPage(page, filters)
        : filters.sort || filters.streamingProviderId
          ? await getPopularAllPage(page, filters)
          : await getTrendingAllPage(page, filters);

  return (
    <CatalogPage
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
      showAdvancedFilters={true}
      showStreamingFilter
      showQuickActions
      infiniteScroll={true}
      fullBlur
      tabs={[
        { label: "Todos", href: tabHref(undefined), active: !filters.mediaType },
        { label: "Filmes", href: tabHref("movie"), active: filters.mediaType === "movie" },
        { label: "Programas de TV", href: tabHref("tv"), active: filters.mediaType === "tv" },
        { label: "Games", href: tabHref("game"), active: false },
      ]}
    />
  );
}
