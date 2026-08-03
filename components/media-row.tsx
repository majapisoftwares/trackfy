import type { MediaItem } from "@/src/lib/tmdb/types";
import { MediaCard } from "./media-card";

export function MediaRow({
  items,
  showQuickActions = false,
}: {
  items: MediaItem[];
  showQuickActions?: boolean;
}) {
  return (
    <div className="media-row">
      {items.map((item) => (
        <MediaCard
          item={item}
          key={`${item.mediaType}-${item.id}`}
          showQuickActions={showQuickActions}
        />
      ))}
    </div>
  );
}
