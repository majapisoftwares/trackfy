import Image from "next/image";
import Link from "next/link";
import type { StreamingProviderSlug } from "@/src/lib/streaming";

type StreamingProvider = {
  id: StreamingProviderSlug;
  name: string;
  logo: string;
  logoClassName: string;
};

const providers: StreamingProvider[] = [
  {
    id: "netflix",
    name: "Netflix",
    logo: "/assets/streaming/netflix-transparent.png",
    logoClassName: "streaming-logo-netflix",
  },
  {
    id: "prime-video",
    name: "Prime Video",
    logo: "/assets/streaming/prime-video-transparent.png",
    logoClassName: "streaming-logo-prime-video",
  },
  {
    id: "disney-plus",
    name: "Disney+",
    logo: "/assets/streaming/disney-plus.png",
    logoClassName: "streaming-logo-disney-plus",
  },
  {
    id: "apple-tv-plus",
    name: "Apple TV+",
    logo: "/assets/streaming/apple-tv-plus.png",
    logoClassName: "streaming-logo-apple-tv-plus",
  },
  {
    id: "paramount-plus",
    name: "Paramount+",
    logo: "/assets/streaming/paramount-plus.svg",
    logoClassName: "streaming-logo-paramount-plus",
  },
];

export function StreamingSection() {
  return (
    <section className="streaming-section container" aria-label="Filtrar por streaming">
      <h2 className="streaming-title">Streamings</h2>
      <div className="streaming-cards" aria-label="Streamings">
        {providers.map((provider) => (
          <Link
            aria-label={`Ver conteúdos disponíveis no ${provider.name}`}
            className="streaming-card"
            href={`/streaming/${provider.id}`}
            key={provider.id}
          >
            <Image
              alt=""
              className={provider.logoClassName}
              height={79}
              src={provider.logo}
              width={148}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
