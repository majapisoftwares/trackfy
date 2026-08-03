"use client";

import Image from "next/image";
import Link from "next/link";
import { Archive, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, LogIn, Plus, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTracking } from "@/src/lib/tracking/client";
import { useAuthSession } from "@/src/lib/auth/client";
import { episodeKey } from "@/src/lib/tracking/types";
import type { ContentDetails, Episode } from "@/types/media";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { MediaRow } from "./media-row";
import { SeasonCarousel } from "./season-carousel";
import { TrailerButton } from "./trailer-button";
import { WatchProviderCard } from "./watch-provider-card";
import { Rating } from "./rating";
import { CommunityRating } from "./community-rating";

function EpisodeCard({
  episode,
  isWatched,
  onWatchedChange,
  href,
  isAuthenticated,
}: {
  episode: Episode;
  isWatched: boolean;
  onWatchedChange: (watched: boolean) => void;
  href: string;
  isAuthenticated: boolean;
}) {
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
      <Link className="episode-footer episode-detail-link" href={href}>
        <div>
          <h3 title={episode.title}>{episode.title}</h3>
          <p>Episódio {episode.number}</p>
        </div>
        {episode.rating ? (
          <Rating value={episode.rating} className="episode-rating" />
        ) : (
          <span className="release-pill">{episode.releaseLabel}</span>
        )}
      </Link>
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
  const [isSeriesCompleting, setIsSeriesCompleting] = useState(false);
  const [season, setSeason] = useState(content.seasons[0]?.number ?? 1);
  const [hoveredRating, setHoveredRating] = useState(0);
  const session = useAuthSession();
  const isAuthenticated = Boolean(session.data?.user);
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
  const castRowRef = useRef<HTMLDivElement>(null);
  const [castScroll, setCastScroll] = useState({
    canGoBack: false,
    canGoForward: content.cast.length > 6,
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
  const releasedEpisodes = selectedEpisodes.filter((episode) => episode.rating);
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
  const seriesProgress =
    watched
      ? 100
      : releasedSeriesEpisodes.length > 0
      ? Math.round(
          (watchedSeriesEpisodes / releasedSeriesEpisodes.length) * 100,
        )
      : 0;
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
  }, [content.cast.length]);

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
    if (content.mediaType === "tv" && nextWatched) {
      setIsSeriesCompleting(true);
      window.setTimeout(() => setIsSeriesCompleting(false), 900);
    }
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
      <section className="detail-hero" style={{ "--detail-backdrop": `url(${content.backdropUrl})` } as React.CSSProperties}>
        <div className="container detail-hero-content">
          <aside className="detail-poster-card">
            <div className="detail-poster">
              <Image src={content.posterUrl} alt={`Pôster de ${content.title}`} fill priority sizes="363px" />
            </div>
            <WatchProviderCard availability={content.watchAvailability} />
          </aside>

          <div className="detail-copy">
            <div className="detail-title-row">
              <h1>{content.title}</h1>
              {content.mediaType === "tv" && isAuthenticated && (
                <div
                  className={`series-progress ${isSeriesCompleting ? "is-completing" : ""}`}
                  role="progressbar"
                  aria-label={`${watchedSeriesEpisodes} de ${releasedSeriesEpisodes.length} episódios assistidos`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={seriesProgress}
                  style={{ "--series-progress": `${seriesProgress * 3.6}deg` } as React.CSSProperties}
                >
                  <div className="series-progress-content">
                    <strong>{seriesProgress}%</strong>
                    <span>Concluído</span>
                  </div>
                </div>
              )}
            </div>
            <div className="detail-ratings">
              <Rating value={content.audienceScore} />
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
                          onClick={() => update({
                            rating: value,
                            inList: !watched,
                          })}
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
            <div className="detail-actions">
              {isAuthenticated ? (
                <>
                  <button className={`detail-button primary ${watched ? "active" : ""}`} onClick={toggleSeriesWatched} type="button">
                    <CheckCheck size={20} /> {watched ? "Assistido" : "Marcar como assistido"}
                  </button>
                  {!watched && (
                    <button className={`detail-button ${inList ? "in-list" : ""}`} onClick={() => update({ inList: !inList })} type="button">
                      {inList ? <X size={20} /> : <Plus size={20} />} {inList ? "Remover da minha lista" : "Minha lista"}
                    </button>
                  )}
                </>
              ) : (
                <Link className="detail-button primary" href="/login">
                  <LogIn size={20} /> Entrar para acompanhar
                </Link>
              )}
              {canArchive && (
                <button className={`detail-button ${archived ? "archived" : ""}`} onClick={() => update({ archived: !archived })} type="button">
                  <Archive size={20} /> {archived ? "Desarquivar" : "Arquivar"}
                </button>
              )}
              <span className="action-divider" />
              <TrailerButton contentTitle={content.title} trailer={content.trailer} />
            </div>
            {error && (
              <p className="tracking-error" role="status">
                Não foi possível sincronizar seu progresso.
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="container detail-body">
        <section className="synopsis-section">
          <div className="synopsis-copy">
            <h2>Sinopse</h2>
            <p>{content.synopsis[0]}</p>
            {expanded && content.synopsis[1] && <p>{content.synopsis[1]}</p>}
            {content.synopsis[1] && (
              <button className="read-more" onClick={() => setExpanded((value) => !value)} type="button">
                {expanded ? "Ler menos" : "Ler mais"} <ChevronDown className={expanded ? "rotated" : ""} size={15} />
              </button>
            )}
          </div>
          <dl className="metadata-card">
            {content.mediaType !== "movie" && (
              <div><dt>Temporadas</dt><dd>{content.metadata.seasons}</dd></div>
            )}
            {content.mediaType === "movie" && (
              <div><dt>Duração</dt><dd>{content.metadata.duration ?? "Não informada"}</dd></div>
            )}
            <div><dt>Lançamento</dt><dd>{content.metadata.releaseDate}</dd></div>
            <div><dt>Classificação</dt><dd>{content.metadata.certification}</dd></div>
            <div><dt>Emissora</dt><dd>{content.metadata.network}</dd></div>
          </dl>
        </section>

        <section className="cast-section">
          <h2>{content.mediaType === "tv" ? "Elenco da Série" : "Elenco Principal"}</h2>
          {content.cast.length > 0 ? (
            <div className={`cast-carousel ${castScroll.canGoBack ? "can-go-back" : ""} ${castScroll.canGoForward ? "can-go-forward" : ""}`}>
              <div className="cast-row" ref={castRowRef} onScroll={updateCastScroll}>
                {content.cast.map((person) => (
                  <article className="cast-card" key={person.id}>
                    <Image src={person.photoUrl} alt={person.name} width={160} height={210} />
                    <div className="cast-card-body">
                      <h3 title={person.name}>{person.name}</h3>
                      <p className="cast-character" title={person.character}>{person.character}</p>
                      {person.episodeCount !== undefined && (
                        <p className="cast-episode-count">
                          {person.episodeCount} {person.episodeCount === 1 ? "episódio" : "episódios"}
                        </p>
                      )}
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

        {content.mediaType === "tv" && content.seasons.length > 0 && (
          <section className="episodes-section">
          <div className="episodes-head">
            <h2>Episódios</h2>
            {isAuthenticated && (
              <button
                className={`mark-season ${allSeasonWatched ? "active" : ""}`}
                type="button"
                onClick={toggleSeasonWatched}
                aria-pressed={allSeasonWatched}
                aria-label={allSeasonWatched ? "Desmarcar todos os episódios" : "Marcar temporada como concluída"}
              >
                {allSeasonWatched ? (
                  <>
                    <span className="mark-season-default">Temporada concluída</span>
                    <span className="mark-season-hover">Desmarcar</span>
                  </>
                ) : (
                  <span>Temporada concluída</span>
                )}
                <CheckCheck size={20} />
              </button>
            )}
            <SeasonCarousel
              seasons={content.seasons}
              activeSeason={season}
              onSelect={(item) => setSeason(item.number)}
            />
          </div>
          <div className="episodes-grid">
            {selectedEpisodes.map((episode) => (
              <EpisodeCard
                episode={episode}
                href={`/series/${content.id}/season/${season}/episode/${episode.number}`}
                isWatched={Boolean(watchedEpisodes[episode.id])}
                key={episode.id}
                isAuthenticated={isAuthenticated}
                onWatchedChange={(nextWatched) =>
                  void toggleEpisodeWatched(
                    season,
                    episode.number,
                    nextWatched,
                  )
                }
              />
            ))}
          </div>
          </section>
        )}

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
