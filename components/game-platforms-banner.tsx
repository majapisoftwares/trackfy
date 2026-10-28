import Link from "next/link";
import { GAME_PLATFORM_FILTERS } from "@/src/lib/games/platforms";

const platformVisuals = [
  {
    slug: "steam",
    tone: "steam",
    logoUrl: "https://cdn.simpleicons.org/steam/ffffff",
  },
  {
    slug: "playstation",
    tone: "playstation",
    logoUrl: "https://cdn.simpleicons.org/playstation/ffffff",
  },
  {
    slug: "xbox",
    tone: "xbox",
    logoUrl: "/assets/platforms/xbox-logo-white.png",
  },
  {
    slug: "nintendo-switch",
    tone: "nintendo",
    logoUrl: "/assets/platforms/nintendo-switch-logo.svg",
  },
];

export function GamePlatformsBanner({ activePlatform }: { activePlatform?: string }) {
  return (
    <section className="content-section game-platforms-banner container" aria-labelledby="platformas-principais">
      <div className="game-platforms-heading">
        <h2 id="platformas-principais" className="section-title">Principais plataformas</h2>
        {activePlatform && <Link href="/games" className="game-platforms-clear">Limpar filtro</Link>}
      </div>
      <ul>
        {platformVisuals.map((platform) => {
          const filter = GAME_PLATFORM_FILTERS.find((item) => item.slug === platform.slug);
          if (!filter) return null;
          const isActive = activePlatform === platform.slug;
          return (
          <li key={platform.slug}>
            <Link className={`platform-card platform-card--${platform.tone} ${isActive ? "is-active" : ""}`} href={`/games?platform=${filter.slug}`} aria-current={isActive ? "page" : undefined}>
              {/* External brand marks intentionally bypass Next image optimization. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="platform-card-logo" src={platform.logoUrl} alt="" />
              <span>{filter.label}</span>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
