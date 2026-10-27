import { ContinueFromSection } from "@/components/continue-from-section";
import { DiscoverySection } from "@/components/discovery-section";
import { Footer } from "@/components/footer";
import { HeroBanner } from "@/components/hero-banner";
import { MixedContentSection } from "@/components/mixed-content-section";
import { DashboardShell } from "@/components/dashboard-shell";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { mapMovie, mapTVShow } from "@/src/lib/tmdb/mappers";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { getContinueWatchingItems } from "@/src/lib/tracking/continue-watching";
import { listTrackingEntries } from "@/src/lib/tracking/repository";
import type { TrackingEntry } from "@/src/lib/tracking/types";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  getMovieDetails,
  getPopularAnime,
  getPopularMovies,
  getPopularTVShows,
  getRecommendations,
  getTVShowDetails,
  getTrendingAll,
  selectFeaturedContent,
} from "@/src/lib/tmdb/endpoints";

async function getTrackedMedia(entry: TrackingEntry): Promise<MediaItem | null> {
  try {
    return entry.mediaType === "movie"
      ? mapMovie(await getMovieDetails(entry.mediaId))
      : mapTVShow(await getTVShowDetails(entry.mediaId));
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
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return Boolean(airDate && airDate > `${value("year")}-${value("month")}-${value("day")}`);
}

function distinctMedia(items: MediaItem[], excluded: Set<string>, limit = 8): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.mediaType}:${item.id}`;
    if (excluded.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

async function getPersonalizedHome(ownerId: string, generalMedia: MediaItem[]) {
  const tracking = await listTrackingEntries(ownerId, { limit: 100, offset: 0 });
  const entries = tracking.items;
  const [continueWatching, recommendationGroups] = await Promise.all([
    getContinueWatchingItems(entries),
    Promise.all(
      entries
        .filter((entry) => entry.inList || entry.watched || entry.watchedEpisodes.length > 0 || entry.rating !== null)
        .slice(0, 4)
        .map(async (entry) => ({
          sourceTitle: entry.title,
          items: await getRecommendations(entry.mediaType, entry.mediaId).catch(() => []),
        })),
    ),
  ]);

  const activeEpisodes = continueWatching.filter((item) => item.airDate !== null && item.airDate !== undefined && !isFutureEpisode(item.airDate));
  const continuingSeries = new Set(activeEpisodes.map((item) => `tv:${item.seriesId}`));
  const knownMedia = new Set(entries.map((entry) => `${entry.mediaType}:${entry.mediaId}`));
  const savedEntries = entries
    .filter((entry) =>
      entry.inList &&
      !entry.watched &&
      !entry.archived &&
      entry.watchedEpisodes.length === 0 &&
      !continuingSeries.has(`${entry.mediaType}:${entry.mediaId}`),
    )
    .sort((left, right) =>
      (right.addedToListAt ?? right.updatedAt).localeCompare(left.addedToListAt ?? left.updatedAt),
    );
  const [savedMedia, recommendedFromHistory] = await Promise.all([
    Promise.all(savedEntries.map(getTrackedMedia)),
    Promise.resolve(recommendationGroups.flatMap(({ sourceTitle, items }) => items.map((item) => ({ item, sourceTitle })))),
  ]);

  const recommendationReasons: Record<string, string> = {};
  const recommendations = recommendedFromHistory.filter(({ item }, index, all) => {
    const key = `${item.mediaType}:${item.id}`;
    return !knownMedia.has(key) && all.findIndex((candidate) => `${candidate.item.mediaType}:${candidate.item.id}` === key) === index;
  }).slice(0, 8).map(({ item, sourceTitle }) => {
    recommendationReasons[`${item.mediaType}-${item.id}`] = `Porque você acompanhou ${sourceTitle}`;
    return item;
  });
  const hasPersonalizedRecommendations = recommendations.length > 0;

  return {
    continueWatching: activeEpisodes.slice(0, 8),
    myList: savedMedia.filter((item): item is MediaItem => item !== null).slice(0, 8),
    recommendations: hasPersonalizedRecommendations ? recommendations : distinctMedia(generalMedia, knownMedia),
    hasPersonalizedRecommendations,
    recommendationReasons,
  };
}

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch (error) {
    console.warn("Uma seção da Home não pôde ser carregada", {
      cause: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return fallback;
  }
}

export default async function Home() {
  await connection();
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
  const [trending, popularMovies, popularTVShows, popularAnime] = await Promise.all([
    safe(getTrendingAll(), [] as MediaItem[]),
    safe(getPopularMovies(), [] as MediaItem[]),
    safe(getPopularTVShows(), [] as MediaItem[]),
    safe(getPopularAnime(), [] as MediaItem[]),
  ]);
  const discoveryMedia = [...popularMovies, ...popularTVShows, ...popularAnime, ...trending];
  const personalized = user
    ? await safe(getPersonalizedHome(user.ownerId, discoveryMedia), null)
    : null;
  const allPopular = [...trending, ...popularTVShows, ...popularMovies].filter((item, index, self) =>
    Boolean(item.backdropPath) &&
    Boolean(item.overview) &&
    item.title !== "Título indisponível" &&
    self.findIndex((candidate) => candidate.id === item.id && candidate.mediaType === item.mediaType) === index,
  );
  const featuredList = allPopular.slice(0, 6);
  const featured = selectFeaturedContent(featuredList) ?? featuredList[0] ?? selectFeaturedContent(trending);

  return (
    <>
      <DashboardShell wide>
        {featuredList.length > 0 && <div className="hero-shell"><HeroBanner items={featuredList} initialItem={featured ?? undefined} /></div>}
        <div className={`content-stack ${personalized ? "logged-in-stack" : ""}`}>
          {personalized ? (
            <>
              <ContinueFromSection episodeItems={personalized.continueWatching} />
              <MixedContentSection id="minha-lista" title="Minha lista" subtitle="Conteúdos que você salvou para consumir depois" mediaItems={personalized.myList} href="/minha-lista" emptyMessage="Sua lista está vazia. Salve filmes, séries ou animes para encontrá-los aqui." emptyAction={{ href: "/populares", label: "Explorar conteúdos" }} />
              <MixedContentSection id="descubra-seu-proximo-favorito" title="Descubra seu próximo favorito" subtitle={personalized.hasPersonalizedRecommendations ? "Recomendações selecionadas com base nos seus interesses." : "Sugestões gerais para você explorar."} mediaItems={personalized.recommendations} showAll={false} emptyMessage="Ainda não há sugestões disponíveis no momento." emptyAction={{ href: "/populares", label: "Explorar populares" }} mediaLabel={personalized.hasPersonalizedRecommendations ? undefined : "Sugestões gerais"} />
            </>
          ) : (
            <>
              <ContinueFromSection episodeItems={[]} />
              <MixedContentSection id="minha-lista" title="Minha lista" subtitle="Conteúdos que você salvou para consumir depois" mediaItems={[]} href="/login" emptyMessage="Entre para salvar filmes, séries e animes na sua lista." emptyAction={{ href: "/login", label: "Entrar" }} />
              <MixedContentSection id="descubra-seu-proximo-favorito" title="Descubra seu próximo favorito" subtitle="Sugestões gerais para você explorar." mediaItems={distinctMedia(discoveryMedia, new Set())} showAll={false} emptyMessage="Ainda não há sugestões disponíveis no momento." emptyAction={{ href: "/populares", label: "Explorar populares" }} mediaLabel="Sugestões gerais" />
            </>
          )}
          <DiscoverySection movies={popularMovies.slice(0, 8)} series={popularTVShows.slice(0, 8)} anime={popularAnime.slice(0, 8)} />
        </div>
      </DashboardShell>
      <Footer />
    </>
  );
}
