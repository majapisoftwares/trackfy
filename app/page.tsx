import { ContentSection } from "@/components/content-section";
import {
  ContinueWatchingSection,
  type ContinueWatchingItem,
} from "@/components/continue-watching-section";
import {
  UpcomingEpisodesSection,
  type UpcomingEpisodeItem,
} from "@/components/upcoming-episodes-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroBanner } from "@/components/hero-banner";
import { StreamingSection } from "@/components/streaming-section";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { mapMovie, mapTVShow } from "@/src/lib/tmdb/mappers";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { listTrackingEntries } from "@/src/lib/tracking/repository";
import { episodeKey, type TrackingEntry } from "@/src/lib/tracking/types";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  getMovieDetails,
  getPopularMovies,
  getPopularAnime,
  getPopularTVShows,
  getRecommendations,
  getTVSeasonDetails,
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

async function getContinueWatchingItem(
  entry: TrackingEntry,
): Promise<ContinueWatchingItem | null> {
  if (entry.mediaType !== "tv" || entry.watchedEpisodes.length === 0) {
    return null;
  }

  const lastWatched = [...entry.watchedEpisodes].sort(
    (left, right) =>
      right.seasonNumber - left.seasonNumber ||
      right.episodeNumber - left.episodeNumber,
  )[0];
  const watched = new Set(entry.watchedEpisodes.map(episodeKey));

  try {
    const season = await getTVSeasonDetails(
      entry.mediaId,
      lastWatched.seasonNumber,
    );
    const nextEpisode = season.episodes.find(
      (episode) =>
        episode.episode_number === lastWatched.episodeNumber + 1 &&
        !watched.has(`${season.season_number}:${episode.episode_number}`),
    );

    if (nextEpisode) {
      return {
        seriesId: entry.mediaId,
        seriesTitle: entry.title,
        episodeTitle: nextEpisode.name || `Episódio ${nextEpisode.episode_number}`,
        seasonNumber: season.season_number,
        episodeNumber: nextEpisode.episode_number,
        stillPath: nextEpisode.still_path,
        posterUrl: entry.posterUrl,
        voteAverage: nextEpisode.vote_average,
        airDate: nextEpisode.air_date,
      };
    }

    const show = await getTVShowDetails(entry.mediaId);
    const nextSeason = show.seasons
      .filter((candidate) => candidate.season_number > lastWatched.seasonNumber)
      .sort((left, right) => left.season_number - right.season_number)[0];

    if (!nextSeason) return null;

    const followingSeason = await getTVSeasonDetails(
      entry.mediaId,
      nextSeason.season_number,
    );
    const firstEpisode = followingSeason.episodes.find(
      (episode) =>
        episode.episode_number > 0 &&
        !watched.has(
          `${followingSeason.season_number}:${episode.episode_number}`,
        ),
    );

    if (!firstEpisode) return null;

    return {
      seriesId: entry.mediaId,
      seriesTitle: show.name ?? entry.title,
      episodeTitle: firstEpisode.name || `Episódio ${firstEpisode.episode_number}`,
      seasonNumber: followingSeason.season_number,
      episodeNumber: firstEpisode.episode_number,
      stillPath: firstEpisode.still_path,
      posterUrl: show.poster_path
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : entry.posterUrl,
      voteAverage: firstEpisode.vote_average,
      airDate: firstEpisode.air_date,
    };
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

async function getUpcomingEpisodeItem(
  entry: TrackingEntry,
): Promise<UpcomingEpisodeItem | null> {
  if (entry.mediaType !== "tv" || entry.watchedEpisodes.length === 0) {
    return null;
  }

  const lastWatched = [...entry.watchedEpisodes].sort(
    (left, right) =>
      right.seasonNumber - left.seasonNumber ||
      right.episodeNumber - left.episodeNumber,
  )[0];
  const watched = new Set(entry.watchedEpisodes.map(episodeKey));

  try {
    const season = await getTVSeasonDetails(
      entry.mediaId,
      lastWatched.seasonNumber,
    );
    let nextEpisode = season.episodes.find(
      (episode) =>
        episode.episode_number === lastWatched.episodeNumber + 1 &&
        !watched.has(`${season.season_number}:${episode.episode_number}`),
    );

    if (!nextEpisode) {
      const show = await getTVShowDetails(entry.mediaId);
      const nextSeason = show.seasons
        .filter((candidate) => candidate.season_number > lastWatched.seasonNumber)
        .sort((left, right) => left.season_number - right.season_number)[0];

      if (!nextSeason) return null;

      const followingSeason = await getTVSeasonDetails(
        entry.mediaId,
        nextSeason.season_number,
      );
      nextEpisode = followingSeason.episodes.find(
        (episode) =>
          episode.episode_number > 0 &&
          !watched.has(
            `${followingSeason.season_number}:${episode.episode_number}`,
          ),
      );

      if (!nextEpisode || !isFutureEpisode(nextEpisode.air_date)) return null;

      return {
        seriesId: entry.mediaId,
        seriesTitle: show.name ?? entry.title,
        episodeTitle: nextEpisode.name || `Episódio ${nextEpisode.episode_number}`,
        seasonNumber: followingSeason.season_number,
        episodeNumber: nextEpisode.episode_number,
        stillPath: nextEpisode.still_path,
        posterUrl: show.poster_path
          ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
          : entry.posterUrl,
        airDate: nextEpisode.air_date,
      };
    }

    if (!isFutureEpisode(nextEpisode.air_date)) return null;

    return {
      seriesId: entry.mediaId,
      seriesTitle: entry.title,
      episodeTitle: nextEpisode.name || `Episódio ${nextEpisode.episode_number}`,
      seasonNumber: season.season_number,
      episodeNumber: nextEpisode.episode_number,
      stillPath: nextEpisode.still_path,
      posterUrl: entry.posterUrl,
      airDate: nextEpisode.air_date,
    };
  } catch {
    return null;
  }
}

async function getPersonalizedHome(ownerId: string) {
  const tracking = await listTrackingEntries(ownerId, { limit: 100, offset: 0 });
  const entries = tracking.items;
  const recommendationSeeds = entries.filter(
    (entry) => entry.inList || entry.watched || entry.watchedEpisodes.length > 0,
  );
  const [continueWatching, upcomingEpisodes, myList, recommendationGroups] = await Promise.all([
    Promise.all(entries.map(getContinueWatchingItem)),
    Promise.all(entries.map(getUpcomingEpisodeItem)),
    Promise.all(entries.filter((entry) => entry.inList).map(getTrackedMedia)),
    Promise.all(
      recommendationSeeds.slice(0, 4).map((entry) =>
        getRecommendations(entry.mediaType, entry.mediaId).catch(() => []),
      ),
    ),
  ]);
  const knownIds = new Set(entries.map((entry) => `${entry.mediaType}:${entry.mediaId}`));
  const recommendations = recommendationGroups
    .flat()
    .filter((item, index, all) => {
      const key = `${item.mediaType}:${item.id}`;
      return !knownIds.has(key) && all.findIndex((candidate) => `${candidate.mediaType}:${candidate.id}` === key) === index;
    })
    .slice(0, 5);

  return {
    isFirstAccess: entries.length === 0,
    hasWatchedEpisodes: entries.some(
      (entry) => entry.watchedEpisodes.length > 0,
    ),
    continueWatching: continueWatching
      .filter((item): item is ContinueWatchingItem => item !== null)
      .filter(
        (item) =>
          item.airDate !== null &&
          item.airDate !== undefined &&
          !isFutureEpisode(item.airDate),
      ),
    upcomingEpisodes: upcomingEpisodes
      .filter((item): item is UpcomingEpisodeItem => item !== null)
      .sort((left, right) => left.airDate.localeCompare(right.airDate)),
    myList: myList.filter((item): item is MediaItem => item !== null).slice(0, 5),
    hasFullMyList: myList.filter((item): item is MediaItem => item !== null).length >= 5,
    recommendations,
  };
}

export default async function Home() {
  await connection();
  let data;
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
    const [trending, popularMovies, popularTVShows, popularAnime, personalized] =
      await Promise.all([
      getTrendingAll(),
      getPopularMovies(),
      getPopularTVShows(),
      getPopularAnime(),
      user ? getPersonalizedHome(user.ownerId) : Promise.resolve(null),
    ]);
    const popular = [...popularMovies.slice(0, 3), ...popularTVShows.slice(0, 2)];
    data = {
      featured: selectFeaturedContent(trending),
      popular,
      popularMovies: popularMovies.slice(0, 5),
      popularTVShows: popularTVShows.slice(0, 5),
      popularAnime: popularAnime.slice(0, 5),
      // Temporário: este ranking será substituído por métricas do banco do Trackfy.
      top: popular.slice(0, 5).map((item, index) => ({
        ...item,
        rankingPosition: index + 1,
      })),
      personalized,
    };
  } catch (error) {
    console.error("Não foi possível montar a home do Trackfy", {
      cause: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return (
      <>
        <main>
          <div className="catalog-error-shell">
            <Header />
            <div className="catalog-state container" role="alert">
              <h1>O catálogo está temporariamente indisponível</h1>
              <p>Tente novamente em alguns instantes.</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!data.featured) {
    return (
      <>
        <main>
          <div className="catalog-error-shell">
            <Header />
            <div className="catalog-state container">
              <h1>Nenhum título disponível</h1>
              <p>O catálogo ainda não possui conteúdo para exibir.</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main>
        <div className="hero-shell">
          <Header />
          <HeroBanner item={data.featured} />
        </div>
        <div className="content-stack">
          {data.personalized ? (
            data.personalized.isFirstAccess ? (
              <>
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
                <ContentSection
                  id="populares"
                  title="Populares agora"
                  subtitle="Produções em alta neste momento"
                  items={data.popular}
                  href="/populares"
                />
                <ContentSection
                  title="Top 5 no Trackfy"
                  subtitle="As produções mais assistidas no Trackfy nas últimas 24 horas"
                  items={data.top}
                  showAll={false}
                />
                <StreamingSection />
              </>
            ) : (
              <>
                {data.personalized.hasWatchedEpisodes && (
                  <>
                    <ContinueWatchingSection
                      items={data.personalized.continueWatching}
                    />
                    <UpcomingEpisodesSection
                      items={data.personalized.upcomingEpisodes}
                    />
                  </>
                )}
                <ContentSection
                  id="minha-lista"
                  title="Minha lista"
                  subtitle="Conteúdos que você salvou para assistir"
                  items={data.personalized.myList}
                  showAll={data.personalized.hasFullMyList}
                  href="/minha-lista"
                />
              <ContentSection
                title="Com base no seu gosto"
                subtitle="Novas recomendações a partir da sua lista e histórico"
                items={data.personalized.recommendations}
                showAll={false}
              />
              <ContentSection
                id="populares"
                title="Populares agora"
                subtitle="Produções em alta neste momento"
                items={data.popular}
                href="/populares"
              />
              <ContentSection
                title="Top 5 no Trackfy"
                subtitle="As produções mais assistidas no Trackfy nas últimas 24 horas"
                items={data.top}
                showAll={false}
              />
              <StreamingSection />
              </>
            )
          ) : (
            <>
              <ContentSection
                id="populares"
                title="Populares agora"
                subtitle="Produções em alta neste momento"
                items={data.popular}
                href="/populares"
              />
              <ContentSection title="Filmes populares" subtitle="Os filmes mais populares do momento" items={data.popularMovies} href="/filmes/populares" />
              <ContentSection title="Seriados populares" subtitle="As séries mais populares do momento" items={data.popularTVShows} href="/series/populares" />
              <ContentSection title="Animes populares" subtitle="Animações japonesas em destaque no catálogo" items={data.popularAnime} href="/animes/populares" />
              <ContentSection title="Top 5 no Trackfy" subtitle="As produções mais assistidas no Trackfy nas últimas 24 horas" items={data.top} showAll={false} />
              <StreamingSection />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
