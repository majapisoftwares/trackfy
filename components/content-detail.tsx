"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Plus,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTracking } from "@/src/lib/tracking/client";
import { useAuthSession } from "@/src/lib/auth/client";
import { episodeKey } from "@/src/lib/tracking/types";
import type { ContentDetails, Episode } from "@/types/media";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { MediaRow } from "./media-row";
import { TrailerButton } from "./trailer-button";
import { Rating } from "./rating";
import { CommunityRating } from "./community-rating";
import { DropdownMenu } from "./interior/dropdown";
import { FixedBackdrop } from "./fixed-backdrop";
import { useEpisodeDrawer } from "@/components/episode-drawer-context";
import { CustomListPicker } from "./custom-list-picker";

function EpisodeCard({
  showId,
  showTitle,
  seasonNumber,
  episode,
  isWatched,
  onWatchedChange,
  isAuthenticated,
}: {
  showId: number;
  showTitle: string;
  seasonNumber: number;
  episode: Episode;
  isWatched: boolean;
  onWatchedChange: (watched: boolean) => void;
  isAuthenticated: boolean;
}) {
  const { openEpisodeDrawer } = useEpisodeDrawer();

  const handleOpenDrawer = (e: React.MouseEvent) => {
    e.preventDefault();
    openEpisodeDrawer({
      showId,
      seasonNumber,
      episodeNumber: episode.number,
      initialData: {
        title: episode.title,
        showTitle,
        imageUrl: episode.imageUrl,
        voteAverage: episode.rating ?? undefined,
      },
    });
  };

  return (
    <article className={`episode-card ${isWatched ? "is-watched" : "is-unwatched"}`}>
      <Image
        className="episode-image"
        src={episode.imageUrl}
        alt={`Cena do episódio ${episode.number}: ${episode.title}`}
        fill
        sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 415px"
      />
      <div className="episode-shade" />
      {episode.rating && (isAuthenticated ? (
        <button
          className={`episode-state-button ${isWatched ? "watched-badge" : "unwatched-badge"}`}
          type="button"
          aria-label={isWatched ? "Marcar episódio como não assistido" : "Marcar episódio como assistido"}
          aria-pressed={isWatched}
          onClick={() => onWatchedChange(!isWatched)}
        >
          <Check size={15} strokeWidth={3} />
          <span className="episode-state-label">
            {isWatched ? "Marcar como não assistido" : "Marcar como assistido"}
          </span>
        </button>
      ) : (
        <Link
          className="episode-state-button unwatched-badge"
          href="/login"
          aria-label="Entrar para acompanhar"
        >
          <LogIn size={15} strokeWidth={3} />
          <span className="episode-state-label">Entrar para acompanhar</span>
        </Link>
      ))}
      <button
        type="button"
        className="episode-footer episode-detail-link text-left bg-transparent border-0 cursor-pointer"
        onClick={handleOpenDrawer}
      >
        <div>
          <h3 title={episode.title}>{episode.title}</h3>
          <p>Episódio {episode.number}</p>
        </div>
        {episode.rating ? (
          <Rating value={episode.rating} className="episode-rating" />
        ) : (
          <span className="release-pill">{episode.releaseLabel}</span>
        )}
      </button>
    </article>
  );
}

export function ContentDetail({
  content,
  recommendations = [],
  canRate = true,
}: {
  content: ContentDetails;
  recommendations?: MediaItem[];
  canRate?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [season, setSeason] = useState(content.seasons[0]?.number ?? 1);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const searchParams = useSearchParams();
  const { openEpisodeDrawer } = useEpisodeDrawer();
  const session = useAuthSession();
  const isAuthenticated = Boolean(session.data?.user);

  useEffect(() => {
    const urlSeason = searchParams.get("season");
    const urlEpisode = searchParams.get("episode");
    if (urlSeason && urlEpisode && content.mediaType === "tv") {
      const sNum = Number(urlSeason);
      const eNum = Number(urlEpisode);
      if (sNum > 0 && eNum > 0) {
        setSeason(sNum);
        const epData = content.seasons
          .find((s) => s.number === sNum)
          ?.episodes.find((e) => e.number === eNum);
        openEpisodeDrawer({
          showId: content.id,
          seasonNumber: sNum,
          episodeNumber: eNum,
          initialData: epData
            ? {
                title: epData.title,
                showTitle: content.title,
                imageUrl: epData.imageUrl,
                voteAverage: epData.rating ?? undefined,
              }
            : { showTitle: content.title },
        });
      }
    }
  }, [searchParams, content, openEpisodeDrawer]);
  const { entry, error, update, updateAsync, updateEpisodes } = useTracking(
    content.mediaType,
    content.id,
    {
      title: content.title,
      posterUrl: content.posterUrl,
    },
  );
  const watched = entry?.watched ?? false;
  const archived = entry?.archived ?? false;
  const inList = entry?.inList ?? false;
  const rating = entry?.rating ?? 0;
  const castItems = useMemo(() => content.cast.slice(0, 10), [content.cast]);
  const castRowRef = useRef<HTMLDivElement>(null);
  const [castScroll, setCastScroll] = useState({
    canGoBack: false,
    canGoForward: castItems.length > 6,
  });
  const watchedEpisodeKeys = useMemo(
    () =>
      new Set(
        (entry?.watchedEpisodes ?? []).map((episode) => episodeKey(episode)),
      ),
    [entry?.watchedEpisodes],
  );
  const watchedEpisodes = useMemo(
    () =>
      Object.fromEntries(
        content.seasons.flatMap((item) =>
          item.episodes.map((episode) => [
            episode.id,
            (content.mediaType === "tv" && watched) || watchedEpisodeKeys.has(
              episodeKey({
                seasonNumber: item.number,
                episodeNumber: episode.number,
              }),
            ),
          ]),
        ),
    ),
    [content.mediaType, content.seasons, watched, watchedEpisodeKeys],
  );
  const selectedEpisodes = useMemo(
    () => content.seasons.find((item) => item.number === season)?.episodes ?? [],
    [content.seasons, season],
  );
  const releasedEpisodes = useMemo(
    () => selectedEpisodes.filter((episode) => episode.rating),
    [selectedEpisodes],
  );
  const releasedSeriesEpisodes = useMemo(
    () =>
      content.seasons.flatMap((item) =>
        item.episodes.filter((episode) => episode.rating),
      ),
    [content.seasons],
  );
  const allReleasedEpisodeKeys = useMemo(
    () =>
      content.seasons.flatMap((item) =>
        item.episodes
          .filter((episode) => episode.rating)
          .map((episode) => ({
            seasonNumber: item.number,
            episodeNumber: episode.number,
          })),
      ),
    [content.seasons],
  );
  const watchedSeriesEpisodes = releasedSeriesEpisodes.filter(
    (episode) => watchedEpisodes[episode.id],
  ).length;
  const allSeasonWatched =
    releasedEpisodes.length > 0 && releasedEpisodes.every((episode) => watchedEpisodes[episode.id]);
  const canArchive = inList || watched || watchedSeriesEpisodes > 0;

  useEffect(() => {
    const row = castRowRef.current;
    if (!row) return;

    const update = () => {
      setCastScroll({
        canGoBack: row.scrollLeft > 1,
        canGoForward: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(row);
    update();

    return () => observer.disconnect();
  }, [castItems.length]);

  function toggleSeasonWatched() {
    updateEpisodes({
      episodes: releasedEpisodes.map((episode) => ({
        seasonNumber: season,
        episodeNumber: episode.number,
      })),
      watched: !allSeasonWatched,
      target: "watched",
    });
  }

  function toggleSeriesWatched() {
    const nextWatched = !watched;
    update({ watched: nextWatched });

    if (content.mediaType === "tv" && allReleasedEpisodeKeys.length > 0) {
      updateEpisodes({
        episodes: allReleasedEpisodeKeys,
        watched: nextWatched,
        target: "watched",
      });
    }
  }

  async function toggleEpisodeWatched(
    seasonNumber: number,
    episodeNumber: number,
    nextWatched: boolean,
  ) {
    if (content.mediaType === "tv" && watched && !nextWatched) {
      try {
        await updateAsync({ watched: false });
      } catch {
        return;
      }
      const remainingEpisodes = allReleasedEpisodeKeys.filter(
        (episode) =>
          episode.seasonNumber !== seasonNumber ||
          episode.episodeNumber !== episodeNumber,
      );
      if (remainingEpisodes.length > 0) {
        updateEpisodes({
          episodes: remainingEpisodes,
          watched: true,
          target: "watched",
        });
      }
      return;
    }

    updateEpisodes({
      episodes: [{ seasonNumber, episodeNumber }],
      watched: nextWatched,
      target: "watched",
    });
  }

  function updateCastScroll() {
    const row = castRowRef.current;
    if (!row) return;

    setCastScroll({
      canGoBack: row.scrollLeft > 1,
      canGoForward: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
    });
  }

  function scrollCast(direction: -1 | 1) {
    const row = castRowRef.current;
    if (!row) return;
    row.scrollBy({
      left: direction * Math.max(row.clientWidth - 80, 160),
      behavior: "smooth",
    });
  }

  return (
    <>
      <FixedBackdrop
        backdropUrl={content.backdropUrl}
        activeId={content.id}
        className="detail-page-backdrop"
      />

      {/* ── Hero ── */}
      <section
        className={`detail-hero detail-mobile-detail detail-hero-${content.mediaType}`}
        style={{ "--detail-backdrop": `url(${content.backdropUrl})` } as React.CSSProperties}
      >
        <div className="container detail-hero-content">

          <div className="detail-mobile-art" aria-hidden="true">
            <Image
              src={content.backdropUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 0px"
              priority
            />
          </div>

          {/* Left: copy */}
          <div className="detail-copy">
            <h1>{content.title}</h1>

            <div className="detail-ratings">
              <Rating value={content.audienceScore} icon="star" />
              <i />
              <span><b className="imdb">IMDb</b> {content.imdbRating.toFixed(1)}</span>
              <i />
              <CommunityRating
                mediaType={content.mediaType}
                mediaId={content.id}
                imdbRating={content.imdbRating}
              />
              <i />
              <span>{content.year}</span>
              <i />
              <span>{content.status}</span>
            </div>

            <div className="detail-tags-rate">
              <div className="genre-tags">{content.genres.map((genre) => <span key={genre}>{genre}</span>)}</div>
              {canRate && isAuthenticated && (
                <>
                  <span className="rate-label">Avaliar</span>
                  <span className="rate-stars" aria-label="Avaliar conteúdo" onMouseLeave={() => setHoveredRating(0)}>
                    {[1, 2, 3, 4, 5].map((value) => {
                      const active = value <= (hoveredRating || rating);
                      return (
                        <button
                          className={active ? "active" : ""}
                          key={value}
                          type="button"
                          aria-label={`Avaliar com ${value} ${value === 1 ? "estrela" : "estrelas"}`}
                          aria-pressed={rating === value}
                          onClick={() => update({ rating: value, inList: !watched })}
                          onFocus={() => setHoveredRating(value)}
                          onBlur={() => setHoveredRating(0)}
                          onMouseEnter={() => setHoveredRating(value)}
                        >
                          <Star size={17} />
                        </button>
                      );
                    })}
                  </span>
                </>
              )}
            </div>

            <p className="detail-tagline">{content.tagline}</p>

            {/* Synopsis inline */}
            <div className="detail-synopsis">
              <p>{content.synopsis[0]}</p>
              {expanded && content.synopsis[1] && <p>{content.synopsis[1]}</p>}
              {content.synopsis[1] && (
                <button className="read-more" onClick={() => setExpanded((v) => !v)} type="button">
                  {expanded ? "Ler menos" : "Ler mais"} <ChevronDown className={expanded ? "rotated" : ""} size={15} />
                </button>
              )}
            </div>

            <div className="detail-actions flex flex-wrap items-center gap-1.5 mt-5">
              <div className="detail-primary-actions">
                {isAuthenticated ? (
                  <>
                    <button
                      className={`flex items-center gap-1.5 rounded-full font-semibold text-sm px-4 py-2.5 transition-all shadow-sm shrink-0 ${
                        watched
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-white text-stone-950 hover:bg-stone-200"
                      }`}
                      onClick={toggleSeriesWatched}
                      type="button"
                    >
                      {watched ? <Check size={16} strokeWidth={2.5} /> : <CheckCheck size={16} strokeWidth={2.5} />}
                      <span>{watched ? "Assistido" : "Marcar como assistido"}</span>
                    </button>
                    <button
                      className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] backdrop-blur-md text-stone-200 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.22] text-sm font-medium px-4 py-2.5 transition-all shrink-0"
                      onClick={() => {
                        if (inList) update({ inList: false });
                        else setListPickerOpen(true);
                      }}
                      type="button"
                    >
                      {inList ? <X size={16} /> : <Plus size={16} />}
                      <span>{inList ? "Remover da minha lista" : "Minha lista"}</span>
                    </button>
                  </>
                ) : (
                  <Link
                    className="detail-button primary shrink-0"
                    href="/login"
                  >
                    <LogIn size={16} />
                    <span>Entrar para acompanhar</span>
                  </Link>
                )}
              </div>

              <CustomListPicker
                open={listPickerOpen}
                onOpenChange={setListPickerOpen}
                mediaType={content.mediaType}
                mediaId={content.id}
                title={content.title}
                posterUrl={content.posterUrl}
                onDefaultSave={() => update({ inList: true })}
              />

              <div className="detail-secondary-actions">
                {canArchive && (
                  <button
                    className={`flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] backdrop-blur-md text-stone-200 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.22] text-sm font-medium px-4 py-2.5 transition-all shrink-0 ${
                      archived ? "bg-white/20 border-white/30 text-white" : ""
                    }`}
                    onClick={() => update({ archived: !archived })}
                    type="button"
                  >
                    <Archive size={16} />
                    <span>{archived ? "Desarquivar" : "Arquivar"}</span>
                  </button>
                )}
                {canArchive && <span className="w-px h-5 bg-white/20 mx-0.5 shrink-0" />}
                <TrailerButton
                  contentTitle={content.title}
                  trailer={content.trailer}
                  className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] backdrop-blur-md text-stone-200 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.22] text-sm font-medium px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                />
              </div>
            </div>

            {error && (
              <p className="tracking-error" role="status">
                Não foi possível sincronizar seu progresso.
              </p>
            )}
          </div>

          {/* Right: info panel */}
          <aside className="detail-info-panel">
            <h2 className="detail-info-panel-title">
              {content.mediaType === "tv" ? "Informações da Série" : "Informações do Filme"}
            </h2>
            <dl className="detail-info-list">
              {content.mediaType !== "movie" && (
                <div><dt>Temporadas</dt><dd>{content.metadata.seasons}</dd></div>
              )}
              {content.mediaType === "movie" && (
                <div><dt>Duração</dt><dd>{content.metadata.duration ?? "Não informada"}</dd></div>
              )}
              <div><dt>Lançamento</dt><dd>{content.metadata.releaseDate}</dd></div>
              <div><dt>Status</dt><dd>{content.status}</dd></div>
              <div><dt>Classificação</dt><dd>{content.metadata.certification}</dd></div>
              <div><dt>Emissora</dt><dd>{content.metadata.network}</dd></div>
              <div>
                <dt>Onde assistir</dt>
                <dd>
                  {content.watchAvailability && content.watchAvailability.providers.length > 0 ? (
                    <a
                      className="metadata-watch-provider"
                      href={content.watchAvailability.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${content.watchAvailability.label}: ${content.watchAvailability.providers.map((p) => p.name).join(", ")}`}
                    >
                      {content.watchAvailability.providers[0].name}
                      {content.watchAvailability.providers.length > 1
                        ? ` e +${content.watchAvailability.providers.length - 1}`
                        : ""}
                    </a>
                  ) : (
                    <span className="metadata-unavailable">Não disponível</span>
                  )}
                </dd>
              </div>
            </dl>
          </aside>

        </div>
      </section>

      {/* ── Body ── */}
      <main className="container detail-body">

        {/* 1. Episódios */}
        {content.mediaType === "tv" && content.seasons.length > 0 && (
          <section className="episodes-section">
            <div className="episodes-head">
              <h2>Episódios</h2>
              <div className="episodes-toolbar">
                {isAuthenticated ? (
                  <button
                    className={`episode-toolbar-btn ${allSeasonWatched ? "is-active" : ""}`}
                    type="button"
                    onClick={toggleSeasonWatched}
                    title={allSeasonWatched ? "Desmarcar temporada" : "Marcar temporada como assistida"}
                  >
                    <Check size={15} />
                    <span>{allSeasonWatched ? "Assistido" : "Marcar como assistido"}</span>
                  </button>
                ) : (
                  <Link className="episode-toolbar-btn" href="/login" title="Entrar para acompanhar">
                    <Check size={15} />
                    <span>Marcar como assistido</span>
                  </Link>
                )}
                <DropdownMenu
                  items={content.seasons.map((item) => ({
                    value: String(item.number),
                    label: `Temporada ${item.number}`,
                    active: item.number === season,
                    onClick: () => setSeason(item.number),
                  }))}
                  side="bottom"
                  align="right"
                  label="Selecionar temporada"
                  trigger={
                    <span className="episode-toolbar-btn episode-season-select">
                      <span>Temporada {season}</span>
                      <ChevronDown size={15} />
                    </span>
                  }
                />
              </div>
            </div>
            <div className="episodes-grid">
              {selectedEpisodes.map((episode) => (
                <EpisodeCard
                  showId={content.id}
                  showTitle={content.title}
                  seasonNumber={season}
                  episode={episode}
                  isWatched={Boolean(watchedEpisodes[episode.id])}
                  key={episode.id}
                  isAuthenticated={isAuthenticated}
                  onWatchedChange={(nextWatched) =>
                    void toggleEpisodeWatched(season, episode.number, nextWatched)
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* 2. Elenco */}
        <section className="cast-section">
          <h2>{content.mediaType === "tv" ? "Elenco da Série" : "Elenco Principal"}</h2>
          {castItems.length > 0 ? (
            <div className={`cast-carousel ${castScroll.canGoBack ? "can-go-back" : ""} ${castScroll.canGoForward ? "can-go-forward" : ""}`}>
              <div className="cast-row" ref={castRowRef} onScroll={updateCastScroll}>
                {castItems.map((person) => (
                  <article className="cast-avatar-card" key={person.id}>
                    <div className="cast-avatar-wrap">
                      <Image src={person.photoUrl} alt={person.name} width={90} height={90} />
                    </div>
                    <div className="cast-avatar-body">
                      <h3 title={person.name}>{person.name}</h3>
                      <p className="cast-character" title={person.character}>{person.character}</p>
                    </div>
                  </article>
                ))}
              </div>
              {castScroll.canGoBack && (
                <button className="cast-scroll-button previous" type="button" aria-label="Ver integrantes anteriores do elenco" onClick={() => scrollCast(-1)}>
                  <ChevronLeft size={22} />
                </button>
              )}
              {castScroll.canGoForward && (
                <button className="cast-scroll-button next" type="button" aria-label="Ver mais integrantes do elenco" onClick={() => scrollCast(1)}>
                  <ChevronRight size={22} />
                </button>
              )}
            </div>
          ) : (
            <p className="detail-empty">Elenco não disponível.</p>
          )}
        </section>

        {/* 3. Você também pode gostar */}
        <section className="recommendations-section">
          <h2>Você também pode gostar</h2>
          {recommendations.length > 0 ? (
            <MediaRow items={recommendations} />
          ) : (
            <p className="detail-empty">Nenhuma recomendação disponível.</p>
          )}
        </section>

      </main>
    </>
  );
}
