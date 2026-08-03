"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Star } from "lucide-react";
import type { MediaType } from "@/src/lib/tmdb/types";

export function CommunityRating({
  mediaType,
  mediaId,
  imdbRating,
}: {
  mediaType: MediaType;
  mediaId: number;
  imdbRating: number;
}) {
  const { data } = useQuery({
    queryKey: ["community-rating", mediaType, mediaId],
    queryFn: async () => {
      const response = await fetch(`/api/ratings/${mediaType}/${mediaId}`);
      if (!response.ok) throw new Error("COMMUNITY_RATING_FAILED");
      return (await response.json()) as { rating: { average: number | null; count: number } };
    },
  });

  const communityRating = data?.rating.average;
  const average = communityRating ?? imdbRating / 2;
  const isImdbFallback = !communityRating || data?.rating.count === 0;

  return (
    <span
      className="community-rating"
      aria-label={
        isImdbFallback
          ? `Nota IMDb convertida: ${average.toFixed(1)} de 5 estrelas`
          : `Nota média da comunidade: ${average.toFixed(1)} de 5, com ${data.rating.count} avaliações`
      }
    >
      <Image src="/assets/logo-mark.svg" alt="" width={17} height={20} />
      <strong>{average.toFixed(1)}/5</strong>
      <Star aria-hidden="true" size={16} fill="currentColor" />
    </span>
  );
}
