import { ContentSection } from "@/components/content-section";
import { ContinueWatchingSection } from "@/components/continue-watching-section";
import { HistorySection } from "@/components/history-section";
import { Footer } from "@/components/footer";
import { DashboardShell } from "@/components/dashboard-shell";
import { HeroBanner } from "@/components/hero-banner";
import { GenreSection } from "@/components/genre-section";
import { StreamingSection } from "@/components/streaming-section";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { mapMovie, mapTVShow } from "@/src/lib/tmdb/mappers";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { listTrackingEntries } from "@/src/lib/tracking/repository";
import type { TrackingEntry } from "@/src/lib/tracking/types";
import { getContinueWatchingItems } from "@/src/lib/tracking/continue-watching";
import { getWatchHistoryItems } from "@/src/lib/tracking/history";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  getMovieDetails,
  getPopularMovies,
  getPopularTVShows,
  getRecommendations,
  getTVShowDetails,
  getTrendingAll,
  selectFeaturedContent,
} from "@/src/lib/tmdb/endpoints";

async function getTrackedMedia(entry: TrackingEntry): Promise<MediaItem | null> {
  try {
    if (entry.mediaType === "movie") {
      return mapMovie(await getMovieDetails(entry.mediaId));
    }
    return mapTVShow(await getTVShowDetails(entry.mediaId));
  } catch {
    return null;
  }
}

function isFutureEpisode(airDate: string | null): airDate is string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const today = `${value("year")}-${value("month")}-${value("day")}`;

  return Boolean(airDate && airDate > today);
}

async function getPersonalizedHome(ownerId: string) {
  const tracking = await listTrackingEntries(ownerId, { limit: 100, offset: 0 });
  const entries = tracking.items;
  const recommendationSeeds = entries.filter(
    (entry) => entry.inList || entry.watched || entry.watchedEpisodes.length > 0,
  );
  const [continueWatching, history, myList, recommendationGroups] = await Promise.all([
    getContinueWatchingItems(entries),
    getWatchHistoryItems(entries, 12),
    Promise.all(entries.filter((entry) => entry.inList).map(getTrackedMedia)),
    Promise.all(
      recommendationSeeds.slice(0, 4).map(async (entry) => ({
        sourceTitle: entry.title,
        items: await getRecommendations(entry.mediaType, entry.mediaId).catch(() => []),
      })),
    ),
  ]);
  const knownIds = new Set(entries.map((entry) => `${entry.mediaType}:${entry.mediaId}`));
  const recommendationReasons: Record<string, string> = {};
  const recommendations = recommendationGroups
    .flatMap(({ sourceTitle, items }) =>
      items.map((item) => ({ item, sourceTitle })),
    )
    .filter(({ item }, index, all) => {
      const key = `${item.mediaType}:${item.id}`;
      return !knownIds.has(key) && all.findIndex((candidate) => `${candidate.item.mediaType}:${candidate.item.id}` === key) === index;
    })
    .slice(0, 8)
    .map(({ item, sourceTitle }) => {
      recommendationReasons[`${item.mediaType}-${item.id}`] = `Porque você acompanhou ${sourceTitle}`;
      return item;
    });

  return {
    isFirstAccess: entries.length === 0,
    watchedMediaKeys: new Set(
      entries
        .filter((entry) => entry.watched)
        .map((entry) => `${entry.mediaType}-${entry.mediaId}`),
    ),
    hasWatchedEpisodes: entries.some(
      (entry) => entry.watchedEpisodes.length > 0,
    ),
    continueWatching: continueWatching.filter(
      (item) =>
        item.airDate !== null &&
        item.airDate !== undefined &&
        !isFutureEpisode(item.airDate),
    ),
    history,
    myList: myList.filter((item): item is MediaItem => item !== null).slice(0, 8),
    hasFullMyList: myList.filter((item): item is MediaItem => item !== null).length >= 8,
    recommendations,
    recommendationReasons,
  };
}

export default async function Home() {
  await connection();
  let data;
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
    const [trending, popularMovies, popularTVShows, personalized] =
      await Promise.all([
      getTrendingAll(),
      getPopularMovies(),
      getPopularTVShows(),
      user ? getPersonalizedHome(user.ownerId) : Promise.resolve(null),
    ]);
    const allPopular = [
      ...trending,
      ...popularTVShows,
      ...popularMovies,
    ].filter(
      (item, index, self) =>
        Boolean(item.backdropPath) &&
        Boolean(item.overview) &&
        item.title !== "Título indisponível" &&
        self.findIndex(
          (candidate) =>
            candidate.id === item.id && candidate.mediaType === item.mediaType,
        ) === index,
    );

    const uncompletedCandidates = allPopular.filter(
      (item) =>
        !personalized?.watchedMediaKeys.has(`${item.mediaType}-${item.id}`),
    );

    const featuredList = (
      uncompletedCandidates.length >= 3 ? uncompletedCandidates : allPopular
    ).slice(0, 6);

    const primaryFeatured =
      selectFeaturedContent(uncompletedCandidates) ??
      featuredList[0] ??
      selectFeaturedContent(trending);

    data = {
      featured: primaryFeatured,
      featuredList,
      trending: trending.slice(0, 8),
      popularMovies: popularMovies.slice(0, 8),
      popularTVShows: popularTVShows.slice(0, 8),
      personalized,
    };
  } catch (error) {
    console.error("Não foi possível montar a home do Trackfy", {
      cause: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return (
      <>
        <DashboardShell>
          <div className="catalog-error-shell">
            <div className="catalog-state container" role="alert">
              <h1>O catálogo está temporariamente indisponível</h1>
              <p>Tente novamente em alguns instantes.</p>
            </div>
          </div>
        </DashboardShell>
        <Footer />
      </>
    );
  }

  return (
    <>
      <DashboardShell wide>
        {/* Banner em destaque no topo do site com base nos mais populares */}
        {data.featuredList && data.featuredList.length > 0 && (
          <div className="hero-shell">
            <HeroBanner
              items={data.featuredList}
              initialItem={data.featured ?? undefined}
            />
          </div>
        )}

        <div className={`content-stack ${data.personalized ? "logged-in-stack" : ""}`}>
          {data.personalized ? (
            <>
              {/* 1. Assistir a seguir */}
              {data.personalized.continueWatching.length > 0 && (
                <ContinueWatchingSection
                  items={data.personalized.continueWatching.slice(0, 8)}
                />
              )}

              {/* 2. Histórico */}
              {data.personalized.history.length > 0 && (
                <HistorySection items={data.personalized.history.slice(0, 8)} />
              )}

              {/* 3. Minha lista */}
              <ContentSection
                id="minha-lista"
                title="Minha lista"
                subtitle="Conteúdos que você salvou para assistir"
                items={data.personalized.myList}
                showAll={data.personalized.hasFullMyList}
                href="/minha-lista"
                emptyAction={{
                  href: "/populares",
                  label: "Explorar populares",
                }}
              />

              {/* 4. Com base no seu gosto */}
              {data.personalized.recommendations.length > 0 && (
                <ContentSection
                  title="Com base no seu gosto"
                  subtitle="Novas recomendações a partir da sua lista e histórico"
                  items={data.personalized.recommendations}
                  showAll={false}
                />
              )}
            </>
          ) : (
            <>
              <ContentSection
                id="populares"
                title="Tendências"
                subtitle="Produções em alta neste momento"
                items={data.trending}
                href="/populares"
              />
              <ContentSection
                title="Filmes populares"
                subtitle="Os filmes mais populares do momento"
                items={data.popularMovies}
                href="/filmes/populares"
              />
              <ContentSection
                title="Seriados populares"
                subtitle="As séries mais populares do momento"
                items={data.popularTVShows}
                href="/series/populares"
              />
              <StreamingSection />
              <GenreSection />
            </>
          )}
        </div>
      </DashboardShell>
      <Footer />
    </>
  );
}
