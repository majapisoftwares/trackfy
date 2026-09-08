"use client";

import { ExternalLink, Play, Star } from "lucide-react";
import { useEffect, useState } from "react";

type AnimeDetail = {
  url: string;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  synopsis?: string | null;
  images?: { jpg?: { large_image_url?: string | null; image_url?: string | null } };
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  type?: string | null;
  episodes?: number | null;
  status?: string | null;
  aired?: { from?: string | null; to?: string | null; string?: string | null };
  duration?: string | null;
  rating?: string | null;
  trailer?: { url?: string | null };
  genres?: Array<{ mal_id: number; name: string }>;
  themes?: Array<{ mal_id: number; name: string }>;
  demographics?: Array<{ mal_id: number; name: string }>;
  studios?: Array<{ mal_id: number; name: string }>;
  licensors?: Array<{ mal_id: number; name: string }>;
  producers?: Array<{ mal_id: number; name: string }>;
};

type JikanEpisode = {
  mal_id: number;
  url: string;
  title: string;
  title_japanese?: string | null;
  aired?: string | null;
  filler?: boolean;
  recap?: boolean;
};

type JikanEpisodesResponse = {
  data: JikanEpisode[];
};

function number(value?: number | null) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

export function JikanFullmetalDetail() {
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [episodes, setEpisodes] = useState<JikanEpisode[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const read = async <T,>(url: string) => {
      let lastStatus: number | undefined;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(url, { signal: controller.signal });
        if (response.ok) return response.json() as Promise<T>;
        lastStatus = response.status;
        // Jikan is rate-limited. Give it time before retrying transient errors.
        if (![429, 500, 502, 503, 504].includes(response.status)) break;
        await new Promise((resolve) => window.setTimeout(resolve, 1100 * (attempt + 1)));
      }
      throw new Error(`Jikan respondeu ${lastStatus ?? "sem status"}`);
    };

    // The base detail route is lighter and more reliable than /full. Load
    // episodes only after the details are on screen; an episode outage must
    // never hide the whole anime page.
    read<{ data: AnimeDetail }>("https://api.jikan.moe/v4/anime/5114")
      .then(async (detail) => {
        setAnime(detail.data);
        try {
          // Avoid issuing two public Jikan requests in the same rate-limit window.
          await new Promise((resolve) => window.setTimeout(resolve, 1100));
          const episodeResponse = await read<JikanEpisodesResponse>(
            "https://api.jikan.moe/v4/anime/5114/episodes?page=1",
          );
          setEpisodes(episodeResponse.data);
        } catch (episodeCause) {
          if (episodeCause instanceof DOMException && episodeCause.name === "AbortError") return;
          console.warn("Não foi possível carregar episódios da Jikan", { cause: episodeCause });
          setEpisodes([]);
        }
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        console.warn("Não foi possível carregar Fullmetal Alchemist: Brotherhood", { cause });
        setFailed(true);
      });
    return () => controller.abort();
  }, []);

  if (failed) {
    return <main className="jikan-detail-state container">Não foi possível carregar os detalhes deste anime.</main>;
  }

  if (!anime) {
    return <main className="jikan-detail-state container">Carregando detalhes do anime...</main>;
  }

  const poster = anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url ?? "";
  const tags = [...(anime.genres ?? []), ...(anime.themes ?? []), ...(anime.demographics ?? [])].slice(0, 6);
  const studio = anime.studios?.map((item) => item.name).join(", ") || "Não informado";
  const production = anime.producers?.map((item) => item.name).join(", ") || "Não informado";

  return (
    <main className="jikan-detail">
      <div className="jikan-detail-backdrop" style={{ backgroundImage: `url(${poster})` }} aria-hidden="true" />
      <section className="jikan-detail-hero container">
        <div className="jikan-detail-poster">
          {poster && <img src={poster} alt={`Pôster de ${anime.title}`} />}
        </div>
        <div className="jikan-detail-copy">
          <p className="jikan-detail-kicker">Anime · MyAnimeList</p>
          <h1>{anime.title_english || anime.title}</h1>
          {anime.title_japanese && <p className="jikan-detail-original">{anime.title_japanese}</p>}
          <div className="jikan-detail-metrics">
            <span><Star size={16} fill="currentColor" /> {anime.score?.toFixed(2) ?? "—"}</span>
            <i />
            <span>{number(anime.scored_by)} avaliações</span>
            <i />
            <span>{anime.aired?.from?.slice(0, 4) ?? "—"}</span>
            <i />
            <span>{anime.status ?? "—"}</span>
          </div>
          <div className="jikan-detail-tags">
            {tags.map((tag) => <span key={tag.mal_id}>{tag.name}</span>)}
          </div>
          <p className="jikan-detail-synopsis">{anime.synopsis || "Sinopse não disponível."}</p>
          <div className="jikan-detail-actions">
            {anime.trailer?.url && (
              <a className="jikan-detail-trailer" href={anime.trailer.url} target="_blank" rel="noreferrer">
                <Play size={17} fill="currentColor" /> Ver trailer
              </a>
            )}
            <a className="jikan-detail-source" href={anime.url} target="_blank" rel="noreferrer">
              Ver no MyAnimeList <ExternalLink size={15} />
            </a>
          </div>
        </div>
        <aside className="jikan-detail-info">
          <h2>Informações</h2>
          <dl>
            <div><dt>Episódios</dt><dd>{anime.episodes ?? "Não informado"}</dd></div>
            <div><dt>Duração</dt><dd>{anime.duration ?? "Não informada"}</dd></div>
            <div><dt>Exibição</dt><dd>{anime.aired?.string ?? "Não informada"}</dd></div>
            <div><dt>Classificação</dt><dd>{anime.rating ?? "Não informada"}</dd></div>
            <div><dt>Estúdio</dt><dd>{studio}</dd></div>
            <div><dt>Produtores</dt><dd>{production}</dd></div>
            <div><dt>Ranking MAL</dt><dd>#{anime.rank ?? "—"} · popularidade #{anime.popularity ?? "—"}</dd></div>
            <div><dt>Membros</dt><dd>{number(anime.members)}</dd></div>
          </dl>
        </aside>
      </section>
      <section className="jikan-episodes container" aria-labelledby="jikan-episodes-title">
        <div className="jikan-episodes-head">
          <div>
            <p className="jikan-detail-kicker">Temporada 1</p>
            <h2 id="jikan-episodes-title">Episódios</h2>
          </div>
          <span>{episodes ? `${episodes.length} episódios` : "Carregando episódios..."}</span>
        </div>
        {episodes ? (
          episodes.length > 0 ? <ol className="jikan-episodes-list">
          {episodes.map((episode) => (
            <li key={episode.mal_id}>
              <span className="jikan-episode-number">{String(episode.mal_id).padStart(2, "0")}</span>
              <div className="jikan-episode-copy">
                <a href={episode.url} target="_blank" rel="noreferrer">
                  {episode.title_japanese || episode.title}
                </a>
                {episode.title_japanese && episode.title_japanese !== episode.title && (
                  <small>{episode.title}</small>
                )}
              </div>
              <time dateTime={episode.aired ?? undefined}>
                {episode.aired ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(episode.aired)) : "Data não informada"}
              </time>
              <div className="jikan-episode-flags">
                {episode.filler && <span>Filler</span>}
                {episode.recap && <span>Recap</span>}
              </div>
            </li>
          ))}
        </ol> : <p className="jikan-episodes-empty">Os episódios estão temporariamente indisponíveis.</p>
        ) : <p className="jikan-episodes-empty">Carregando a lista de episódios...</p>}
      </section>
    </main>
  );
}
