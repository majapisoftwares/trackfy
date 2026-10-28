import { cookies } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { GamesCatalog } from "@/components/games-catalog";
import { GameSection } from "@/components/game-section";
import { GamePlatformsBanner } from "@/components/game-platforms-banner";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { listUserGames } from "@/src/lib/games/repository";
import { GAME_PLATFORM_FILTERS } from "@/src/lib/games/platforms";
import type { UserGame } from "@/src/lib/games/types";
import { getGameItem, getGamesPage } from "@/src/lib/rawg/endpoints";
import type { GameItem, GamePage } from "@/src/lib/rawg/types";

export const metadata = {
  title: "Games | Trackfy",
  description: "Descubra e acompanhe seus jogos no Trackfy.",
};

function toGameItem(game: UserGame): GameItem {
  return {
    id: game.gameId,
    slug: game.slug,
    name: game.name,
    released: null,
    backgroundImage: game.coverUrl,
    rating: null,
    ratingsCount: 0,
    metacritic: null,
    genres: [],
    platforms: [],
  };
}

const emptyPage: GamePage = {
  page: 1,
  pageSize: 12,
  count: 0,
  results: [],
};

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

type GamesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  await connection();
  const params = await searchParams;
  const platformSlug = typeof params.platform === "string" ? params.platform : undefined;
  const selectedPlatform = GAME_PLATFORM_FILTERS.find((platform) => platform.slug === platformSlug);
  const platformFilters = selectedPlatform ? { platforms: selectedPlatform.rawgPlatforms } : {};

  if (selectedPlatform) {
    const filteredGames = await getGamesPage({
      ordering: "-added",
      pageSize: 24,
      ...platformFilters,
    }).catch(() => emptyPage);

    return (
      <>
        <DashboardShell wide>
          <div className="content-stack games-page-stack">
            <section className="game-platform-results container" aria-labelledby="platform-results-title">
              <Link className="game-platform-back" href="/games">Todos os games</Link>
              <h1 id="platform-results-title">Games para {selectedPlatform.label}</h1>
              {filteredGames.results.length > 0 ? (
                <GamesCatalog
                  embedded
                  initialItems={filteredGames.results}
                  initialPage={filteredGames.page}
                  initialTotal={filteredGames.count}
                  initialFilters={{ platform: selectedPlatform.rawgPlatforms }}
                  genres={[]}
                  pageSize={filteredGames.pageSize}
                />
              ) : (
                <div className="section-empty"><p>Não encontramos games para esta plataforma agora.</p></div>
              )}
            </section>
            <GamePlatformsBanner activePlatform={selectedPlatform.slug} />
          </div>
        </DashboardShell>
        <Footer />
      </>
    );
  }

  const authToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const oneYearAhead = new Date(today);
  oneYearAhead.setUTCFullYear(oneYearAhead.getUTCFullYear() + 1);
  const [library, publicGames, upcomingReleases] = await Promise.all([
    user ? listUserGames(user.ownerId).catch(() => []) : Promise.resolve([]),
    getGamesPage({ ordering: "-released", pageSize: 40, dates: `1900-01-01,${iso(today)}` }).catch(() => emptyPage),
    getGamesPage({
      ordering: "-added",
      pageSize: 12,
      dates: `${iso(tomorrow)},${iso(oneYearAhead)}`,
    }).catch(() => emptyPage),
  ]);
  const knownGameIds = new Set(library.map((game) => game.gameId));
  const hydrateGames = (games: UserGame[]) => Promise.all(games.map(async (game, index) => {
    const fallback = toGameItem(game);
    if (index >= 8) return fallback;
    const catalogGame = await getGameItem(game.slug).catch(() => null);
    return { ...fallback, released: catalogGame?.released ?? null };
  }));
  const [playing, wishlist] = await Promise.all([
    hydrateGames(library.filter((game) => game.status === "playing")),
    hydrateGames(library.filter((game) => game.status === "wishlist")),
  ]);
  const suggestions = publicGames.results
    .filter((game) => !knownGameIds.has(game.id))
    .sort((a, b) => b.ratingsCount - a.ratingsCount || (b.released ?? "").localeCompare(a.released ?? ""));

  return (
    <>
      <DashboardShell wide>
        <div className="content-stack games-page-stack">
          <GameSection
            id="jogando"
            title="Jogando"
            items={playing}
            href="/minha-lista#meus-games"
            showAll={playing.length >= 7}
            emptyMessage="Você ainda não marcou nenhum game como jogando."
            emptyAction={{ href: "#games-em-alta", label: "Descobrir games" }}
          />
          <GameSection
            id="quero-jogar"
            title="Quero jogar"
            items={wishlist}
            href="/minha-lista#meus-games"
            showAll={wishlist.length >= 7}
            emptyMessage="Sua lista de jogos para jogar está vazia."
            emptyAction={{ href: "#games-em-alta", label: "Explorar games" }}
          />
          <GameSection
            id="games-em-alta"
            title="Games em alta"
            items={suggestions}
            emptyMessage="Não foi possível carregar sugestões de games agora."
          />
          <GameSection
            id="proximos-lancamentos"
            title="Próximos lançamentos"
            items={upcomingReleases.results.filter((game) => !knownGameIds.has(game.id))}
            emptyMessage="Não foi possível carregar os próximos lançamentos agora."
          />
          <GamePlatformsBanner />
        </div>
      </DashboardShell>
      <Footer />
    </>
  );
}
