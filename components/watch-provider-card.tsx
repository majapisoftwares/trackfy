import { ExternalLink, Tv } from "lucide-react";
import Image from "next/image";
import type { WatchAvailability } from "@/types/media";

export function WatchProviderCard({
  availability,
}: {
  availability: WatchAvailability | null;
}) {
  if (!availability) {
    return (
      <div
        className="watch-provider unavailable"
        aria-label="Não há opções para assistir no Brasil"
      >
        <Tv aria-hidden="true" size={21} />
        <span>
          <strong>Onde assistir</strong>
          <small>Não disponível no Brasil</small>
        </span>
      </div>
    );
  }

  const visibleProviders = availability.providers.slice(0, 3);
  const additionalProviders = availability.providers.length - 1;
  const providerNames = availability.providers.map((item) => item.name).join(", ");

  return (
    <a
      className="watch-provider"
      href={availability.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${availability.label}: ${providerNames}. Abrir opções para assistir`}
    >
      <span className="watch-provider-logos" aria-hidden="true">
        {visibleProviders.map((provider) => (
          <Image
            key={provider.id}
            src={provider.logoUrl}
            alt=""
            width={38}
            height={38}
          />
        ))}
      </span>
      <span className="watch-provider-copy">
        <small>{availability.label}</small>
        <strong>
          {availability.providers[0].name}
          {additionalProviders > 0 ? ` e +${additionalProviders}` : ""}
        </strong>
        <em>Dados por JustWatch</em>
      </span>
      <ExternalLink className="watch-provider-open" aria-hidden="true" size={16} />
    </a>
  );
}
