"use client";

import { AlarmClockCheck, Check, CheckCheck, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useTracking } from "@/src/lib/tracking/client";
import { episodeKey } from "@/src/lib/tracking/types";
import type { EpisodePageData } from "@/src/lib/tmdb/episode";
import { SeasonCarousel } from "./season-carousel";
import { TrailerButton } from "./trailer-button";
import { WatchProviderCard } from "./watch-provider-card";
import { Rating } from "./rating";

function releaseLabel(airDate: string | null): string {
  if (!airDate) return "Data não informada";
  return `Estreia em ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${airDate}T00:00:00Z`))}`;
}

export function EpisodeDetail({
  episode,
  canRate = false,
}: {
  episode: EpisodePageData;
  canRate?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { entry, error, updateEpisodes } = useTracking(
    "tv",
    episode.showId,
    {
      title: episode.showTitle,
      posterUrl: episode.posterUrl,
    },
  );
  const watchedEpisodeKeys = useMemo(
    () =>
      new Set(
        (entry?.watchedEpisodes ?? []).map((trackedEpisode) =>
          episodeKey(trackedEpisode),
        ),
      ),
    [entry?.watchedEpisodes],
  );
  const watchLaterEpisodeKeys = useMemo(
    () =>
      new Set(
        (entry?.watchLaterEpisodes ?? []).map((trackedEpisode) =>
          episodeKey(trackedEpisode),
        ),
      ),
    [entry?.watchLaterEpisodes],
  );
  const currentEpisode = {
    seasonNumber: episode.seasonNumber,
    episodeNumber: episode.episodeNumber,
  };
  const watched = watchedEpisodeKeys.has(episodeKey(currentEpisode));
  const watchLater = watchLaterEpisodeKeys.has(episodeKey(currentEpisode));

  return (
    <>
      <section
        className="episode-hero"
        style={
          { "--episode-backdrop": `url(${episode.backdropUrl})` } as CSSProperties
        }
      >
        <div className="container episode-hero-content">
          <aside className="episode-poster-card">
            <Link
              className="episode-poster"
              href={`/series/${episode.showId}`}
              aria-label={`Ver página da série ${episode.showTitle}`}
            >
              <Image
                src={episode.posterUrl}
                alt={`Pôster de ${episode.showTitle}`}
                fill
                priority
                sizes="363px"
              />
            </Link>
            <WatchProviderCard availability={episode.watchAvailability} />
          </aside>

          <div className="episode-hero-copy">
            <h1>{episode.title}</h1>
            <div className="episode-rating-row">
              <Rating value={episode.audienceScore} />
              <i />
              <span>
                <b className="imdb">IMDb</b> {episode.voteAverage.toFixed(1)}
              </span>
              {canRate && (
                <>
                  <i />
                  <span className="rate-label">Avaliar</span>
                  <span
                    className="rate-stars"
                    aria-label="Avaliar episódio"
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        className={
                          value <= (hoveredRating || rating) ? "active" : ""
                        }
                        key={value}
                        type="button"
                        aria-label={`Avaliar com ${value} estrelas`}
                        aria-pressed={rating === value}
                        onClick={() => setRating(value)}
                        onFocus={() => setHoveredRating(value)}
                        onBlur={() => setHoveredRating(0)}
                        onMouseEnter={() => setHoveredRating(value)}
                      >
                        <Star size={17} />
                      </button>
                    ))}
                  </span>
                </>
              )}
            </div>
            <div className="episode-actions">
              <button
                className={`detail-button primary ${watched ? "active" : ""}`}
                onClick={() =>
                  updateEpisodes({
                    episodes: [currentEpisode],
                    watched: !watched,
                    target: "watched",
                  })
                }
                type="button"
              >
                {watched ? <Check size={20} /> : <CheckCheck size={20} />}
                {watched ? "Assistido" : "Marcar como assistido"}
              </button>
              <button
                className={`detail-button ${watchLater ? "active" : ""}`}
                onClick={() =>
                  updateEpisodes({
                    episodes: [currentEpisode],
                    watched: !watchLater,
                    target: "watchLater",
                  })
                }
                type="button"
              >
                <AlarmClockCheck size={20} />
                {watchLater ? "Salvo para depois" : "Assistir mais tarde"}
              </button>
              <span className="action-divider" />
              <TrailerButton
                contentTitle={episode.title}
                trailer={episode.trailer}
              />
            </div>
            {error && (
              <p className="tracking-error" role="status">
                Não foi possível sincronizar seu progresso.
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="container episode-body">
        <section className="episode-synopsis">
          <h2>Sinopse do episódio</h2>
          <p>{episode.overview}</p>
        </section>

        <section className="episode-info-panel">
          <h2>Informações do Episódio</h2>
          <dl>
            <div><dt>Diretor</dt><dd>{episode.metadata.director}</dd></div>
            <div><dt>Roteirista</dt><dd>{episode.metadata.writer}</dd></div>
            <div><dt>Gênero</dt><dd>{episode.metadata.genres}</dd></div>
            <div><dt>Idioma Original</dt><dd>{episode.metadata.originalLanguage}</dd></div>
            <div><dt>Classificação</dt><dd>{episode.metadata.certification}</dd></div>
          </dl>
        </section>

        <section className="episode-cast-section">
          <h2>Elenco do episódio</h2>
          {episode.cast.length > 0 ? (
            <div className="cast-row">
              {episode.cast.map((person) => (
                <article className="cast-card" key={person.id}>
                  <Image
                    src={person.photoUrl}
                    alt={person.name}
                    width={140}
                    height={140}
                  />
                  <h3>{person.name}</h3>
                  <p>{person.character}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="detail-empty">Elenco não disponível.</p>
          )}
        </section>

        <section className="episode-list-section">
          <div className="episode-list-head">
            <h2>Episódios</h2>
            <SeasonCarousel
              seasons={episode.seasons}
              activeSeason={episode.seasonNumber}
              getHref={(season) =>
                `/series/${episode.showId}/season/${season.number}/episode/1`
              }
            />
          </div>
          <div className="episode-page-grid">
            {episode.episodes.map((item) => {
              const trackedEpisode = {
                seasonNumber: episode.seasonNumber,
                episodeNumber: item.number,
              };
              const isWatched = watchedEpisodeKeys.has(
                episodeKey(trackedEpisode),
              );
              const href = `/series/${episode.showId}/season/${episode.seasonNumber}/episode/${item.number}`;
              return (
                <article
                  className={`episode-page-card ${
                    item.number === episode.episodeNumber ? "current" : ""
                  }`}
                  key={item.id}
                >
                  <Image
                    src={item.imageUrl}
                    alt={`Cena de ${item.title}`}
                    fill
                    sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 415px"
                  />
                  <div className="episode-shade" />
                  {item.voteAverage > 0 && (
                    <button
                      className={`episode-state-button ${
                        isWatched ? "watched-badge" : "unwatched-badge"
                      }`}
                      type="button"
                      aria-label={
                        isWatched
                          ? "Marcar episódio como não assistido"
                          : "Marcar episódio como assistido"
                      }
                      onClick={() =>
                        updateEpisodes({
                          episodes: [trackedEpisode],
                          watched: !isWatched,
                          target: "watched",
                        })
                      }
                    >
                      <Check size={15} strokeWidth={3} />
                      <span className="episode-state-label">
                        {isWatched
                          ? "Marcar como não assistido"
                          : "Marcar como assistido"}
                      </span>
                    </button>
                  )}
                  <Link className="episode-card-link" href={href}>
                    <div>
                      <h3 title={item.title}>{item.title}</h3>
                      <p>Episódio {item.number}</p>
                    </div>
                    {item.voteAverage > 0 ? (
                      <Rating
                        value={item.voteAverage}
                        className="episode-rating"
                        icon="status"
                      />
                    ) : (
                      <span className="release-pill">
                        {releaseLabel(item.airDate)}
                      </span>
                    )}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
