import { Clapperboard, Ghost, Heart, Rocket, Smile, Swords } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

const genres = [
  { id: "28", name: "Ação", icon: Swords },
  { id: "12", name: "Aventura", icon: Rocket },
  { id: "35", name: "Comédia", icon: Smile },
  { id: "18", name: "Drama", icon: Heart },
  { id: "27", name: "Terror", icon: Ghost },
  { id: "878", name: "Ficção científica", icon: Clapperboard },
];

type GenreSectionProps = {
  showTitle?: boolean;
  activeGenreId?: string;
  hrefForGenre?: (genreId: string) => string;
} & Pick<ComponentProps<"section">, "className">;

export function GenreSection({
  showTitle = true,
  activeGenreId,
  hrefForGenre,
  className,
}: GenreSectionProps) {
  return (
    <section
      className={`genre-section${showTitle ? " container" : ""}${className ? ` ${className}` : ""}`}
      aria-labelledby={showTitle ? "genres-title" : undefined}
    >
      {showTitle && <h2 className="genre-title" id="genres-title">Gêneros</h2>}
      <div className="genre-cards">
        {genres.map(({ id, name, icon: Icon }) => (
          <Link
            className={`genre-card${activeGenreId === id ? " active" : ""}`}
            href={hrefForGenre?.(id) ?? `/populares?genre=${id}&sort=popularity.desc`}
            key={id}
          >
            <Icon aria-hidden="true" size={25} strokeWidth={1.8} />
            <span>{name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
