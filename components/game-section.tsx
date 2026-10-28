import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { GameItem } from "@/src/lib/rawg/types";
import { GameCard } from "./game-card";

export function GameSection({
  id,
  title,
  subtitle,
  items,
  href,
  showAll = false,
  emptyMessage = "Nenhum jogo disponível no momento.",
  emptyAction,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  items: GameItem[];
  href?: string;
  showAll?: boolean;
  emptyMessage?: string;
  emptyAction?: { href: string; label: string };
}) {
  return <section className="content-section container" data-item-count={Math.min(items.length, 6)} id={id}>
    <div className="section-head"><div><h2 className="section-title">{title}</h2>{subtitle && <p className="section-subtitle">{subtitle}</p>}</div>{showAll && href && <Link className="section-link" href={href}>Ver todos <ChevronRight aria-hidden="true" size={20} /></Link>}</div>
    {items.length ? <div className="media-row game-row">{items.slice(0, 8).map((game) => <GameCard key={game.id} game={game} />)}</div> : <div className="section-empty"><p>{emptyMessage}</p>{emptyAction && <Link className="section-empty-action" href={emptyAction.href}>{emptyAction.label}</Link>}</div>}
  </section>;
}
