import { CalendarDays, Clock3 } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MediaRow } from "@/components/media-row";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { getMovieDetails, getTVShowDetails } from "@/src/lib/tmdb/endpoints";
import { mapMovie, mapTVShow } from "@/src/lib/tmdb/mappers";
import type { MediaItem } from "@/src/lib/tmdb/types";
import { listTrackingEntries } from "@/src/lib/tracking/repository";
import type { TrackingEntry } from "@/src/lib/tracking/types";

async function getMedia(entry: TrackingEntry): Promise<MediaItem | null> {
  try {
    return entry.mediaType === "movie"
      ? mapMovie(await getMovieDetails(entry.mediaId))
      : mapTVShow(await getTVShowDetails(entry.mediaId));
  } catch {
    return null;
  }
}

async function getWatchedMinutes(entry: TrackingEntry): Promise<number> {
  try {
    if (entry.mediaType === "movie") {
      if (!entry.watched) return 0;
      return (await getMovieDetails(entry.mediaId)).runtime ?? 0;
    }

    if (entry.watchedEpisodes.length === 0) return 0;
    const details = await getTVShowDetails(entry.mediaId);
    const episodeRuntime = details.episode_run_time?.find((value) => value > 0) ?? 45;
    return episodeRuntime * entry.watchedEpisodes.length;
  } catch {
    return 0;
  }
}

function formatWatchTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h${minutes ? ` ${minutes}min` : ""}` : `${minutes}min`;
}

function formatJoinDate(createdAt: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt));
}

export default async function ProfilePage() {
  const authToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
  if (!user) redirect("/login");

  const tracking = await listTrackingEntries(user.ownerId, {
    limit: 1_000,
    offset: 0,
  });
  const entries = tracking.items;
  const completedMovies = entries.filter(
    (entry) => entry.mediaType === "movie" && entry.watched,
  );
  const completedShows = entries.filter(
    (entry) => entry.mediaType === "tv" && entry.watched,
  );
  const watchingNow = entries.filter(
    (entry) => entry.mediaType === "tv" && !entry.watched && entry.watchedEpisodes.length > 0,
  );
  const history = entries
    .filter((entry) => entry.watched || entry.watchedEpisodes.length > 0)
    .slice(0, 5);

  const [watchedMinutes, historyItems] = await Promise.all([
    Promise.all(entries.map(getWatchedMinutes)).then((items) =>
      items.reduce((total, minutes) => total + minutes, 0),
    ),
    Promise.all(history.map(getMedia)).then((items) =>
      items.filter((item): item is MediaItem => item !== null),
    ),
  ]);
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <>
      <main className="profile-page">
        <Header />
        <section className="profile-content container" aria-labelledby="profile-title">
          <div className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">{initials}</div>
            <div>
              <h1 id="profile-title">{user.email}</h1>
              <p><CalendarDays aria-hidden="true" size={14} /> Membro desde {formatJoinDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="profile-stats">
            <article className="profile-stat profile-watch-time">
              <span>Tempo total assistido</span>
              <Clock3 aria-hidden="true" size={20} />
              <strong>{formatWatchTime(watchedMinutes)}</strong>
              <p>Tempo acumulado de filmes e episódios acompanhados.</p>
            </article>
            <article className="profile-stat profile-watching-now">
              <span><i aria-hidden="true" /> Assistindo agora</span>
              <strong>{watchingNow.length}</strong>
              <small>Conteúdos em andamento</small>
            </article>
            <article className="profile-stat profile-count">
              <span>Filmes assistidos</span>
              <strong>{completedMovies.length}</strong>
            </article>
            <article className="profile-stat profile-count">
              <span>Séries assistidas</span>
              <strong>{completedShows.length}</strong>
            </article>
          </div>

          <section className="profile-history" aria-labelledby="history-title">
            <div className="profile-history-head">
              <div>
                <h2 id="history-title">Histórico</h2>
                <p>Últimos conteúdos que você acompanhou</p>
              </div>
            </div>
            {historyItems.length > 0 ? (
              <MediaRow items={historyItems} />
            ) : (
              <p className="profile-history-empty">Seu histórico aparecerá aqui quando você marcar conteúdos como assistidos.</p>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
}
