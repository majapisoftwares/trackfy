export type MediaType = "movie" | "tv";

export type MediaItem = {
  id: number;
  mediaType: MediaType;
  adult: boolean;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  year: number | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  rankingPosition?: number;
};

export type TMDBMovie = {
  id: number;
  adult?: boolean;
  media_type?: "movie";
  title?: string;
  original_title?: string;
  original_language?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
};

export type TMDBTVShow = {
  id: number;
  adult?: boolean;
  media_type?: "tv";
  name?: string;
  original_name?: string;
  original_language?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
};

export type TMDBPerson = {
  id: number;
  media_type: "person";
};

export type TMDBMediaResult = TMDBMovie | TMDBTVShow;
export type TMDBMultiResult = TMDBMediaResult | TMDBPerson;

export type TMDBListResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TMDBKeyword = {
  id: number;
  name: string;
};

export type TMDBKeywordsResponse = {
  id: number;
  keywords?: TMDBKeyword[];
  results?: TMDBKeyword[];
};

export type TMDBMovieDetails = TMDBMovie & {
  credits?: TMDBCredits;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string }>;
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{
        certification: string;
        type: number;
      }>;
    }>;
  };
  runtime: number | null;
  status: string;
  tagline: string;
  keywords?: TMDBKeywordsResponse;
  videos?: TMDBVideosResponse;
};

export type TMDBTVShowDetails = TMDBTVShow & {
  aggregate_credits?: TMDBAggregateCredits;
  credits?: TMDBCredits;
  content_ratings?: {
    results: Array<{ iso_3166_1: string; rating: string }>;
  };
  genres: Array<{ id: number; name: string }>;
  networks: Array<{ id: number; name: string }>;
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time?: number[];
  seasons: Array<{
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
  }>;
  status: string;
  tagline: string;
  keywords?: TMDBKeywordsResponse;
  videos?: TMDBVideosResponse;
};

export type TMDBCredits = {
  cast: Array<{
    id: number;
    name: string;
    character?: string;
    profile_path?: string | null;
    order?: number;
  }>;
};

export type TMDBAggregateCredits = {
  cast: Array<{
    id: number;
    name: string;
    profile_path?: string | null;
    order?: number;
    total_episode_count: number;
    roles: Array<{
      credit_id: string;
      character: string;
      episode_count: number;
    }>;
  }>;
};

export type TMDBVideo = {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  official: boolean;
  published_at?: string;
  site: string;
  type: string;
};

export type TMDBVideosResponse = {
  results: TMDBVideo[];
};

export type TMDBWatchProvider = {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
};

export type TMDBWatchProviderRegion = {
  link: string;
  flatrate?: TMDBWatchProvider[];
  free?: TMDBWatchProvider[];
  ads?: TMDBWatchProvider[];
  rent?: TMDBWatchProvider[];
  buy?: TMDBWatchProvider[];
};

export type TMDBWatchProvidersResponse = {
  id: number;
  results: Record<string, TMDBWatchProviderRegion>;
};

export type TMDBEpisode = {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
};

export type TMDBEpisodeCredits = {
  cast: TMDBCreditPerson[];
  guest_stars: TMDBCreditPerson[];
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path?: string | null;
  }>;
};

export type TMDBCreditPerson = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
};

export type TMDBTVEpisodeDetails = TMDBEpisode & {
  credits?: TMDBEpisodeCredits;
  runtime: number | null;
  season_number: number;
  videos?: TMDBVideosResponse;
};

export type TMDBSeasonDetails = {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  poster_path: string | null;
  episodes: TMDBEpisode[];
};

export type PaginatedMedia = {
  page: number;
  results: MediaItem[];
  totalPages: number;
  totalResults: number;
};
