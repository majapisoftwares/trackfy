import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { MediaRow } from "./media-row";

type MixedContentSectionProps = {
  id?: string;
  title: string;
  subtitle: string;
  mediaItems: MediaItem[];
  href?: string;
  showAll?: boolean;
  emptyMessage: string;
  emptyAction: { href: string; label: string };
  mediaLabel?: string;
};

/** Shared home section for media rows and empty states. */
export function MixedContentSection({
  id,
  title,
  subtitle,
  mediaItems,
  href,
  showAll = true,
  emptyMessage,
  emptyAction,
  mediaLabel,
}: MixedContentSectionProps) {
  const hasItems = mediaItems.length > 0;

  return (
    <section className="content-section container" id={id}>
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        {showAll && href && (
          <Link className="section-link" href={href}>
            Ver todos <ChevronRight aria-hidden="true" size={20} />
          </Link>
        )}
      </div>

      {hasItems ? (
        <div className="mixed-section-content">
          {mediaItems.length > 0 && (
            <div className="mixed-section-group">
              {mediaLabel && <h3 className="section-group-label">{mediaLabel}</h3>}
              <MediaRow items={mediaItems.slice(0, 8)} showQuickActions />
            </div>
          )}
        </div>
      ) : (
        <div className="section-empty">
          <p>{emptyMessage}</p>
          <Link className="section-empty-action" href={emptyAction.href}>{emptyAction.label}</Link>
        </div>
      )}
    </section>
  );
}
