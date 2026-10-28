/* RAWG screenshots are intentionally not passed through the image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { Star } from "lucide-react";
import type { GameDetails, GameItem } from "@/src/lib/rawg/types";
import { FixedBackdrop } from "./fixed-backdrop";
import { GameCard } from "./game-card";
import { GameLibraryControls } from "./game-library-controls";
import { RawgAttribution } from "./rawg-attribution";

const list = (items: { name: string }[]) => items.map((item) => item.name).join(", ") || "Não informado";
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`)) : "Não informada";

export function GameDetail({ game, related }: { game: GameDetails; related: GameItem[] }) {
  return <>
    <FixedBackdrop backdropUrl={game.backgroundImage} activeId={game.id} className="detail-page-backdrop" />
    <section className="detail-hero game-detail-hero" style={{ "--detail-backdrop": game.backgroundImage ? `url(${game.backgroundImage})` : undefined } as React.CSSProperties}>
      <div className="container detail-hero-content">
        <div className="detail-copy"><h1>{game.name}</h1>
          <div className="detail-ratings"><span className="score-indicator score-positive"><Star className="score-icon" size={16} />{game.rating?.toFixed(1) ?? "—"}</span><i /><span>{game.released?.slice(0, 4) ?? "Data indisponível"}</span>{game.metacritic !== null && <><i /><span><b className="imdb">MC</b> {game.metacritic}</span></>}</div>
          {game.genres.length > 0 && <div className="detail-tags-rate"><div className="genre-tags">{game.genres.map((genre) => <span key={genre.id}>{genre.name}</span>)}</div></div>}
          <div className="detail-synopsis"><p>{game.description ?? "Descrição não disponível."}</p></div>
          <div className="detail-actions"><GameLibraryControls game={game} /></div>
        </div>
        <aside className="detail-info-panel"><h2 className="detail-info-panel-title">Informações do jogo</h2><dl className="detail-info-list">
          <div><dt>Lançamento</dt><dd>{date(game.released)}</dd></div>
          <div><dt>Gêneros</dt><dd>{list(game.genres)}</dd></div>
          <div><dt>Plataformas</dt><dd>{list(game.platforms)}</dd></div>
          <div><dt>Desenvolvedora</dt><dd>{list(game.developers)}</dd></div><div><dt>Publicadora</dt><dd>{list(game.publishers)}</dd></div>
          {game.website && <div><dt>Site</dt><dd><a className="metadata-watch-provider" href={game.website} target="_blank" rel="noreferrer">Visitar</a></dd></div>}
        </dl></aside>
      </div>
    </section>
    <main className="container detail-body game-detail-body">
      {game.screenshots.length > 0 && <section className="game-screenshots"><h2>Capturas de tela</h2><div>{game.screenshots.slice(0, 8).map((src) => <div key={src}><img src={src} alt={`Captura de tela de ${game.name}`} /></div>)}</div></section>}
      {related.length > 0 && <section className="recommendations-section"><h2>Você também pode gostar</h2><div className="media-row game-row">{related.map((item) => <GameCard key={item.id} game={item} />)}</div></section>}
      <RawgAttribution />
    </main>
  </>;
}
