"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, CheckCircle2, Loader2, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Drawer } from "./interior/drawer";
import { TrailerButton } from "./trailer-button";
import { useTracking } from "@/src/lib/tracking/client";
import { useAuthSession } from "@/src/lib/auth/client";
import { episodeKey } from "@/src/lib/tracking/types";
import type { EpisodePageData } from "@/src/lib/tmdb/episode";

const EPISODE_FALLBACK = "/assets/episode-upcoming.png";
const PERSON_FALLBACK = "/assets/logo-mark.svg";

function formatAirDate(airDate?: string | null): string | null {
  if (!airDate) return null;
  try {
    const date = new Date(`${airDate}T00:00:00Z`);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return null;
  }
}

export type EpisodeDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  initialData?: {
    title?: string;
    showTitle?: string;
    overview?: string;
    imageUrl?: string | null;
    stillPath?: string | null;
    voteAverage?: number;
    airDate?: string | null;
  };
};

export function EpisodeDrawer({
  open,
  onOpenChange,
  showId,
  seasonNumber,
  episodeNumber,
  initialData,
}: EpisodeDrawerProps) {
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const session = useAuthSession();
  const isAuthenticated = Boolean(session.data?.user);

  const { data: episode, isLoading } = useQuery<EpisodePageData>({
    queryKey: ["episode-detail", showId, seasonNumber, episodeNumber],
    queryFn: async () => {
      const res = await fetch(
        `/api/tmdb/episode?showId=${showId}&seasonNumber=${seasonNumber}&episodeNumber=${episodeNumber}`,
      );
      if (!res.ok) throw new Error("Erro ao carregar episódio");
      return res.json();
    },
    enabled: open && Boolean(showId && seasonNumber && episodeNumber),
    staleTime: 10 * 60 * 1000,
  });

  const { entry, updateEpisodes } = useTracking("tv", showId, {
    title: episode?.showTitle || initialData?.showTitle || "Série",
    posterUrl: episode?.posterUrl,
  });

  const watchedEpisodeKeys = useMemo(
    () =>
      new Set(
        (entry?.watchedEpisodes ?? []).map((item) => episodeKey(item)),
      ),
    [entry?.watchedEpisodes],
  );

  const watchLaterEpisodeKeys = useMemo(
    () =>
      new Set(
        (entry?.watchLaterEpisodes ?? []).map((item) => episodeKey(item)),
      ),
    [entry?.watchLaterEpisodes],
  );

  const currentEpisode = { seasonNumber, episodeNumber };
  const watched = watchedEpisodeKeys.has(episodeKey(currentEpisode));
  const watchLater = watchLaterEpisodeKeys.has(episodeKey(currentEpisode));

  const displayTitle = episode?.title || initialData?.title || `Episódio ${episodeNumber}`;
  const displaySubtitle = `Temporada ${seasonNumber} • Episódio ${episodeNumber}`;
  const stillImage = episode?.stillUrl || episode?.episodes?.find(e => e.number === episodeNumber)?.imageUrl || initialData?.imageUrl || initialData?.stillPath || EPISODE_FALLBACK;
  const voteAverage = episode?.voteAverage ?? initialData?.voteAverage ?? 0;
  const ratingPercentage = Math.round(voteAverage * 10);
  const overview = episode?.overview || initialData?.overview || "Sem sinopse disponível.";
  const airDateLabel = formatAirDate(episode?.airDate || initialData?.airDate);
  const runtime = episode?.runtime;
  const certification = episode?.metadata?.certification;
  const genres = episode?.metadata?.genres;
  const director = episode?.metadata?.director;

  const metadataInfoParts = [
    airDateLabel,
    runtime ? `${runtime} min` : null,
    certification && certification !== "Não informada" ? certification : null,
    genres && genres !== "Não informado" ? genres : null,
  ].filter(Boolean);

  const handleToggleWatched = () => {
    updateEpisodes({
      episodes: [currentEpisode],
      watched: !watched,
      target: "watched",
    });
  };

  const handleToggleWatchLater = () => {
    updateEpisodes({
      episodes: [currentEpisode],
      watched: !watchLater,
      target: "watchLater",
    });
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={displayTitle}
      description={displaySubtitle}
      width={440}
      headerClassName="text-center py-5 border-b border-white/10"
      headerTitleClassName="text-center font-bold text-[17px] text-white truncate w-full"
      headerSubtitleClassName="text-center text-xs text-stone-400 font-normal mt-0.5 truncate w-full"
    >
      <div className="flex flex-col gap-5 py-1 text-stone-200">
        {/* Still Image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-stone-900 border border-white/10 shadow-lg">
          <Image
            src={stillImage}
            alt={displayTitle}
            fill
            className="object-cover"
            sizes="(max-width: 480px) 100vw, 440px"
            priority
          />
        </div>

        {/* Ratings & Details Metadata Block */}
        <div className="flex flex-col items-center gap-2 text-center text-xs text-stone-300">
          {/* Row 1: TMDB % | IMDb score */}
          <div className="flex items-center justify-center gap-2.5 font-medium text-stone-200">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>{ratingPercentage > 0 ? `${ratingPercentage}%` : "N/A"}</span>
            </div>
            <span className="text-stone-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-[#f5c518] px-1 py-0.5 text-[10px] font-black text-black leading-none">
                IMDb
              </span>
              <span className="font-semibold">{voteAverage > 0 ? voteAverage.toFixed(1) : "N/A"}</span>
            </div>
          </div>

          {/* Row 2: User rating / star rating control */}
          <div className="flex items-center justify-center gap-2 text-stone-300">
            <span className="font-medium text-stone-300">
              ▷ {voteAverage > 0 ? (voteAverage / 2).toFixed(1).replace(".", ",") : "0,0"}/5
            </span>
            <span className="text-stone-600">•</span>
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="font-medium">Avaliar</span>
            </span>
            <div
              className="flex items-center gap-0.5 ml-1"
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const active = starValue <= (hoveredRating || userRating);
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setUserRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    className="p-0.5 text-stone-500 transition-colors hover:text-amber-400"
                    aria-label={`Avaliar ${starValue} de 5 estrelas`}
                  >
                    <Star
                      size={14}
                      className={active ? "fill-amber-400 text-amber-400" : "text-stone-600"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Release info • Runtime • Certification • Genre */}
          {metadataInfoParts.length > 0 && (
            <p className="text-[11px] text-stone-400 leading-relaxed px-2 mt-0.5">
              {metadataInfoParts.join(" • ")}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-1">
          {/* Primary Action: Marcar como assistido */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleToggleWatched}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 px-4 font-semibold text-sm transition-all shadow-sm ${
                watched
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-white text-stone-950 hover:bg-stone-200"
              }`}
            >
              <CheckCircle2 size={18} className={watched ? "text-white" : "text-stone-950"} />
              <span>{watched ? "Assistido" : "Marcar como assistido"}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 px-4 font-semibold text-sm text-stone-950 hover:bg-stone-200 transition-colors shadow-sm"
            >
              <CheckCircle2 size={18} className="text-stone-950" />
              <span>Entrar para acompanhar</span>
            </Link>
          )}

          {/* Secondary Actions: Minha lista | Trailer */}
          <div className="grid grid-cols-2 gap-2.5">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleToggleWatchLater}
                className={`flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#1a1a20] py-2.5 px-4 text-xs font-medium text-white transition-colors hover:bg-white/10 ${
                  watchLater ? "bg-white/15 border-white/20" : ""
                }`}
              >
                {watchLater ? <Check size={15} /> : <Plus size={15} />}
                <span>{watchLater ? "Na minha lista" : "Minha lista"}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#1a1a20] py-2.5 px-4 text-xs font-medium text-white transition-colors hover:bg-white/10"
              >
                <Plus size={15} />
                <span>Minha lista</span>
              </Link>
            )}

            <TrailerButton
              contentTitle={displayTitle}
              trailer={episode?.trailer ?? null}
              className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#1a1a20] py-2.5 px-4 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Synopsis & Director */}
        <div className="mt-2 border-t border-white/10 pt-4 flex flex-col gap-2">
          <p className="text-xs leading-relaxed text-stone-300 font-normal">
            {overview}
          </p>

          {director && director !== "Não informado" && (
            <p className="text-[11px] text-stone-400 font-normal">
              Dirigido por <span className="text-stone-300 font-medium">{director}</span>
            </p>
          )}
        </div>

        {/* Cast Section */}
        <div className="mt-3 border-t border-white/10 pt-4 flex flex-col gap-3.5">
          <h3 className="text-base font-bold text-white">Elenco do episódio</h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-stone-400 gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs">Carregando elenco...</span>
            </div>
          ) : episode?.cast && episode.cast.length > 0 ? (
            <div className="flex flex-col gap-3">
              {episode.cast.map((actor) => (
                <div key={actor.id} className="flex items-center gap-3.5">
                  <div className="relative size-12 overflow-hidden rounded-full shrink-0 bg-stone-800 border border-white/10">
                    <Image
                      src={actor.photoUrl || PERSON_FALLBACK}
                      alt={actor.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate">
                      {actor.name}
                    </span>
                    <span className="text-xs text-stone-400 truncate mt-0.5">
                      {actor.character}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic">Elenco indisponível para este episódio.</p>
          )}
        </div>
      </div>
    </Drawer>
  );
}

