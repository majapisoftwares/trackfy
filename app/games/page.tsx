import { cookies } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { GamesCatalog } from "@/components/games-catalog";
import { GameSection } from "@/components/game-section";
import { GamePlatformsBanner } from "@/components/game-platforms-banner";
import { RawgAttribution } from "@/components/rawg-attribution";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { listUserGames } from "@/src/lib/games/repository";
import { GAME_PLATFORM_FILTERS } from "@/src/lib/games/platforms";
import type { UserGame } from "@/src/lib/games/types";
import { getGamesPage } from "@/src/lib/rawg/endpoints";
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
                  showAttribution={false}
                />
              ) : (
                <div className="section-empty"><p>Não encontramos games para esta plataforma agora.</p></div>
              )}
            </section>
            <GamePlatformsBanner activePlatform={selectedPlatform.slug} />
            <div className="container"><RawgAttribution /></div>
          </div>
        </DashboardShell>
        <Footer />
      </>
    );
  }

  const authToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const [library, publicGames, recentReleases] = await Promise.all([
    user ? listUserGames(user.ownerId).catch(() => []) : Promise.resolve([]),
    getGamesPage({ ordering: "-added", pageSize: 12 }).catch(() => emptyPage),
    getGamesPage({
      ordering: "-released",
      pageSize: 12,
      dates: `${iso(threeMonthsAgo)},${iso(today)}`,
    }).catch(() => emptyPage),
  ]);
  const knownGameIds = new Set(library.map((game) => game.gameId));
  const playing = library.filter((game) => game.status === "playing").map(toGameItem);
  const wishlist = library.filter((game) => game.status === "wishlist").map(toGameItem);
  const suggestions = publicGames.results.filter((game) => !knownGameIds.has(game.id));

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
            id="ultimos-lancamentos"
            title="Últimos lançamentos"
            items={recentReleases.results.filter((game) => !knownGameIds.has(game.id))}
            emptyMessage="Não foi possível carregar os últimos lançamentos agora."
          />
          <GamePlatformsBanner />
          <div className="container"><RawgAttribution /></div>
        </div>
      </DashboardShell>
      <Footer />
    </>
  );
}
