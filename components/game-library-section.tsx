import type { UserGame } from "@/src/lib/games/types";
import type { GameItem } from "@/src/lib/rawg/types";
import { GameCard } from "./game-card";
import { RawgAttribution } from "./rawg-attribution";

export function GameLibrarySection({ items }: { items: UserGame[] }) {
  if (!items.length) return null;
  const games: GameItem[] = items.map((item) => ({ id: item.gameId, slug: item.slug, name: item.name, released: null, backgroundImage: item.coverUrl, rating: null, ratingsCount: 0, metacritic: null, genres: [], platforms: [] }));
  return <section className="game-library-section" id="meus-games"><div className="catalog-heading"><h2>Meus games</h2><p>Jogos que você quer jogar, está jogando ou já finalizou</p></div><div className="game-library-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div><RawgAttribution /></section>;
}
