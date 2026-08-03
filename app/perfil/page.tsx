import { CalendarDays, ChevronRight, Clock3 } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { DashboardShell } from "@/components/dashboard-shell";
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

type WatchStats = {
  minutes: number;
  episodes: number;
};

async function getWatchStats(entry: TrackingEntry): Promise<WatchStats> {
  try {
    if (entry.mediaType === "movie") {
      return {
        minutes: entry.watched
          ? (await getMovieDetails(entry.mediaId)).runtime ?? 0
          : 0,
        episodes: 0,
      };
    }

    if (!entry.watched && entry.watchedEpisodes.length === 0) {
      return { minutes: 0, episodes: 0 };
    }

    const details = await getTVShowDetails(entry.mediaId);
    const episodeRuntime = details.episode_run_time?.find((value) => value > 0) ?? 45;
    // A series marked as watched may not have each episode persisted separately
    // (for example, when it is completed from a media card).
    const episodes = entry.watched
      ? details.number_of_episodes
      : entry.watchedEpisodes.length;

    return {
      minutes: episodeRuntime * episodes,
      episodes,
    };
  } catch {
    return {
      minutes: 0,
      // Preserve individually tracked episodes if loading show details fails.
      episodes: entry.mediaType === "tv" ? entry.watchedEpisodes.length : 0,
    };
  }
}

function formatWatchTime(totalMinutes: number): string {
  const totalDays = Math.floor(totalMinutes / (60 * 24));
  const totalMonths = Math.floor(totalDays / 30);

  if (totalMonths >= 12) {
    const years = Math.floor(totalMonths / 12);
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  }

  if (totalMonths > 0) {
    return `${totalMonths} ${totalMonths === 1 ? "mês" : "meses"}`;
  }

  if (totalDays > 0) {
    return `${totalDays} ${totalDays === 1 ? "dia" : "dias"}`;
  }

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
  const watchingNow = entries.filter(
    (entry) => entry.mediaType === "tv" && !entry.watched && entry.watchedEpisodes.length > 0,
  );
  const history = entries
    .filter((entry) => entry.watched || entry.watchedEpisodes.length > 0)
    .slice(0, 5);

  const [watchStats, historyItems] = await Promise.all([
    Promise.all(entries.map(getWatchStats)),
    Promise.all(history.map(getMedia)).then((items) =>
      items.filter((item): item is MediaItem => item !== null),
    ),
  ]);
  const watchedMinutes = watchStats.reduce(
    (total, stats) => total + stats.minutes,
    0,
  );
  const watchedEpisodes = watchStats.reduce(
    (total, stats) => total + stats.episodes,
    0,
  );
  const displayName = user.nickname || user.email;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <DashboardShell>
      <section className="profile-page">
        <section className="profile-content container" aria-labelledby="profile-title">
          <div className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">{initials}</div>
            <div className="profile-user-details">
              <h1 id="profile-title">{displayName}</h1>
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
              <span>Episódios assistidos</span>
              <strong>{watchedEpisodes}</strong>
            </article>
          </div>

          <section className="profile-history" aria-labelledby="history-title">
            <div className="profile-history-head">
              <div>
                <h2 id="history-title">Histórico</h2>
                <p>Últimos conteúdos que você acompanhou</p>
              </div>
              <Link className="profile-history-all-button" href="/arquivados">
                Ver todo histórico
                <ChevronRight aria-hidden="true" size={22} strokeWidth={2.25} />
              </Link>
            </div>
            {historyItems.length > 0 ? (
              <MediaRow items={historyItems} />
            ) : (
              <p className="profile-history-empty">Seu histórico aparecerá aqui quando você marcar conteúdos como assistidos.</p>
            )}
          </section>
        </section>
      </section>
      </DashboardShell>
      <Footer />
    </>
  );
}
