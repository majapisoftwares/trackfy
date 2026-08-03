import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { MediaRow } from "./media-row";

type ContentSectionProps = {
  id?: string;
  title: string;
  subtitle: string;
  items: MediaItem[];
  showAll?: boolean;
  href?: string;
  emptyAction?: {
    href: string;
    label: string;
  };
};

export function ContentSection({
  id,
  title,
  subtitle,
  items,
  showAll = true,
  href,
  emptyAction,
}: ContentSectionProps) {
  return (
    <section
      className="content-section container"
      data-item-count={Math.min(items.length, 6)}
      id={id}
    >
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        {showAll && (
          <Link className="section-link" href={href ?? `#${id ?? "conteudo"}`}>
            Ver todos <ChevronRight aria-hidden="true" size={20} />
          </Link>
        )}
      </div>
      {items.length > 0 ? (
        <MediaRow items={items} showQuickActions />
      ) : (
        <div className="section-empty">
          <p>
            {emptyAction
              ? "Sua lista ainda está vazia."
              : "Nenhum título disponível no momento."}
          </p>
          {emptyAction && (
            <Link className="section-empty-action" href={emptyAction.href}>
              {emptyAction.label}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
