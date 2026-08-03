import { tmdbFetch } from "./client";
import { mapMediaResult, mapMovie, mapTVShow } from "./mappers";
import type {
  MediaItem,
  MediaType,
  PaginatedMedia,
  TMDBListResponse,
  TMDBMediaResult,
  TMDBKeywordsResponse,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBMultiResult,
  TMDBSeasonDetails,
  TMDBTVShow,
  TMDBTVEpisodeDetails,
  TMDBTVShowDetails,
  TMDBWatchProvidersResponse,
} from "./types";

const CACHE = {
  trending: 30 * 60,
  popular: 60 * 60,
  details: 24 * 60 * 60,
  season: 6 * 60 * 60,
  recommendations: 60 * 60,
  search: 60,
  streaming: 60 * 60,
} as const;

const EXCLUDED_EDITORIAL_GENRES = new Set([
  16, // Animation
  10762, // Kids
  10763, // News
  10764, // Reality
  10766, // Soap
  10767, // Talk
  10768, // War & Politics
]);

const EXCLUDED_TV_KEYWORDS = [
  13384, // Morning show
  194610, // Variety show
  1560, // Dynamite
  206441, // Pro wrestling
  301798, // All Elite Wrestling (AEW)
  325811, // Excited
];

const BLOCKED_CONTENT_KEYWORDS = [
  195669, // Ecchi
  285672, // Etchi (alternative spelling)
  198385, // Hentai
  155477, // Softcore
  256466, // Erotic
  155691, // Erotic vignettes
  302868, // Erotic comedy
  298666, // Erotic romance
  352503, // Erotic theater
  11275, // Erotic dance
  337325, // Erotic anthology
  256603, // Erotic masseuse
  226010, // Erotic stories
  226161, // Erotic massage
  207767, // Erotic thriller
  207807, // Erotic fantasy
  343572, // Erotic film
  343713, // Erotic wrestling
  328992, // Erotic asphyxiation
  238098, // Erotic art
  190370, // Erotic movie
  192119, // Erotic photography
  192628, // Erotic novel
  240530, // Erotic horror
  325693, // Erotica
  350793, // Greek erotica
  334900, // Swedish erotica
  238059, // Gay erotica
  219371, // Vintage erotica
  355313, // Lesbian erotica
  372609, // Historic erotica
  344391, // Erotico
  229074, // Josei
  445, // Pornography
  199758, // Pornography addiction
  238355, // Gay pornography
  6443, // Child pornography
  335703, // Trans pornography
  154986, // Gonzo pornography
  347722, // Lesbian pornography
  331947, // Bisexual pornography
  364927, // Alt pornography
  364146, // Post-pornography
  176511, // Pornographer
  320667, // Adult film actress
  379142, // Adult film actor
  341305, // Japanese adult film industry
  195997, // Adult filmmaking
  329280, // Sexual content
  281741, // Nudity
  360081, // Partial nudity
  359980, // Female nudity
  367629, // Male frontal nudity
  359981, // Female frontal nudity
  359982, // Female rear nudity
  360333, // Male rear nudity
  362559, // Brief male frontal nudity
  10053, // Sexploitation
  159551, // Pink film
  329413, // Pinku-eiga
  161919, // Adult animation
  363345, // Gay
  258533, // Gay theme
  368294, // Gay themed
  361425, // Gay them
  346769, // Gay interest
  240305, // Gay romance
  329424, // Gay people
  337701, // Gay men
  354597, // Gay males
  354619, // Gay male
  323678, // Gay hardcore
  41515, // Gay parent
  190751, // Gay Muslim
  262497, // Repressed gay
  247821, // Gay youth
  336035, // Gay vampire
  322141, // Gay dads
  245045, // Gay friend
  315665, // Gay son
  327908, // Gay bar
  337111, // Gay detective
  315279, // Gay priest
  158718, // LGBT
  378259, // LGBTQ
  377925, // LGBTQIA+
  379747, // LGBTQ+
  353629, // LGBT romance
  163037, // LGBT teen
  195624, // Black LGBT
  224000, // LGBT parenting
  243575, // Indigenous LGBT
  173669, // LGBT activist
  271115, // Elderly LGBT
  275749, // LGBT activism
  156331, // LGBT athlete
  295736, // LGBT child
  280179, // LGBT rights
  313433, // LGBT history
  377795, // LGBT faith
  367576, // LGBT in Africa
  165614, // LGBT in the military
  264386, // Lesbian
  315385, // Lesbian love
  319872, // Lesbian romance
  315382, // Lesbian couple
  328765, // Lesbian subtext
  333088, // Lesbian fetish
  272066, // Lesbian nun
  290382, // Lesbian affair
  338206, // Lesbian rights
  300522, // Lesbian nurse
  345079, // Lesbian culture
  353473, // Lesbian cannibal
  283414, // Lesbian prison
  289476, // Lesbian kiss
  308705, // Lesbian friend
  353598, // Lesbian breakup
  330531, // Lesbian maid
  307399, // Trans lesbian
  275267, // Lesbian rape
  305694, // Lesbian history
  329968, // Bisexual
  3183, // Bisexuality
  315129, // Bisexual men
  168812, // Bisexual man
  287417, // Bisexual woman
  356745, // Bisexual female
  356746, // Bisexual male
  290527, // Transgender
  351185, // Transgender romance
  326627, // Transgender woman
  321062, // Transgender men
  229325, // Transgender rights
  354064, // Transgender boy
  354065, // Transgender girl
  354066, // Transgender women
  335952, // Transgender lesbian
  355045, // Transgender villain
  359829, // Transgender support
  356747, // Transgender female
  356748, // Transgender male
  250606, // Queer
  304694, // Queer coded
  347179, // Queer sexuality
  300642, // Queer cinema
  346116, // Queer documentary
  329464, // Queer childhood
  321567, // Queer joy
  338474, // Queer rights
  322221, // Queer revenge
  265587, // Queer horror
  351981, // Queer allegory
  344292, // Queer experience
  344293, // Queer media
  337360, // Queer kids
  337238, // Queer loneliness
  346834, // Queer siblings
  283935, // Queer porn
  207958, // Queer activism
  236454, // Same sex attraction
  271167, // Same sex relationship
  253337, // Same sex marriage
  325395, // Same sex parenthood
  379143, // Same sex parents
  354581, // Censored adaptation of same-sex original world
  354582, // Censored adaptation of same-sex original work
  272617, // Homosexual
  275157, // Homosexuality
  10180, // Male homosexuality
  15136, // Female homosexuality
  254199, // Homosexual soldier
  239239, // Closeted homosexual
  365317, // Boy's love
  289844, // Boys' love (BL)
  280003, // Girls' love (GL)
  353318, // Yaoi
  214564, // Yuri
  365272, // Doomed yuri
];

const BLOCKED_CONTENT_KEYWORD_SET = new Set(BLOCKED_CONTENT_KEYWORDS);
const BLOCKED_CONTENT_KEYWORD_QUERY = BLOCKED_CONTENT_KEYWORDS.join("|");

function isEditorialMedia(item: MediaItem): boolean {
  return !item.genreIds.some((genreId) =>
    EXCLUDED_EDITORIAL_GENRES.has(genreId),
  );
}

function getOnAirDateRange(): { start: string; end: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const start = formatter.format(new Date());
  const endDate = new Date(`${start}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 7);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

function mapPage<T>(
  response: TMDBListResponse<T>,
  mapper: (item: T) => MediaItem,
): PaginatedMedia {
  return {
    page: response.page,
    results: response.results.map(mapper),
    totalPages: response.total_pages,
    totalResults: response.total_results,
  };
}

export type CatalogFilters = {
  genre?: string;
  year?: number;
  minRating?: number;
  language?: string;
  sort?: string;
  mediaType?: MediaType;
};

function getCatalogQuery(
  page: number,
  filters: CatalogFilters = {},
  dateSort = "primary_release_date.desc",
): Record<string, string | number | boolean | undefined> {
  return {
    page,
    sort_by:
      filters.sort === "date.desc"
        ? dateSort
        : (filters.sort ?? "popularity.desc"),
    with_genres: filters.genre,
    "vote_average.gte": filters.minRating,
    "vote_count.gte":
      filters.minRating || filters.sort === "vote_average.desc"
        ? 50
        : undefined,
    with_original_language: filters.language,
    include_adult: false,
    without_keywords: BLOCKED_CONTENT_KEYWORD_QUERY,
  };
}

function getTVGenre(genre: string | undefined): string | undefined {
  if (genre === "28") return "10759";
  if (genre === "878") return "10765";
  return genre;
}

function getKeywordIds(response: TMDBKeywordsResponse | undefined): number[] {
  return (response?.keywords ?? response?.results ?? []).map(
    (keyword) => keyword.id,
  );
}

function hasBlockedKeywords(
  response: TMDBKeywordsResponse | undefined,
): boolean {
  return getKeywordIds(response).some((id) =>
    BLOCKED_CONTENT_KEYWORD_SET.has(id),
  );
}

export function isAllowedContentDetails(
  details: TMDBMovieDetails | TMDBTVShowDetails,
): boolean {
  return details.adult !== true && !hasBlockedKeywords(details.keywords);
}

async function getMediaKeywords(
  item: MediaItem,
): Promise<TMDBKeywordsResponse> {
  return tmdbFetch<TMDBKeywordsResponse>(
    item.mediaType === "movie"
      ? `/movie/${item.id}/keywords`
      : `/tv/${item.id}/keywords`,
    { revalidate: CACHE.details },
  );
}

async function filterAllowedMedia(items: MediaItem[]): Promise<MediaItem[]> {
  const candidates = items.filter((item) => !item.adult);
  const allowed = await Promise.all(
    candidates.map(async (item) => {
      try {
        return !hasBlockedKeywords(await getMediaKeywords(item));
      } catch (error) {
        console.error("Não foi possível moderar um item do catálogo", {
          mediaType: item.mediaType,
          mediaId: item.id,
          cause: error instanceof Error ? error.message : "Erro desconhecido",
        });
        return false;
      }
    }),
  );
  return candidates.filter((_, index) => allowed[index]);
}

export async function getTrendingAll(): Promise<MediaItem[]> {
  const data = await tmdbFetch<TMDBListResponse<TMDBMediaResult>>(
    "/trending/all/day",
    { revalidate: CACHE.trending },
  );
  return filterAllowedMedia(
    data.results.map(mapMediaResult).filter(isEditorialMedia),
  );
}

export async function getTrendingAllPage(
  page = 1,
  filters: CatalogFilters = {},
): Promise<PaginatedMedia> {
  const targetSize = 20;
  const results: MediaItem[] = [];
  let sourcePage = page;
  let totalPages = page;
  let totalResults = 0;

  // Some titles are removed by editorial and safety filters. Refill the grid
  // from subsequent TMDB pages so a filtered title does not leave a gap.
  while (
    results.length < targetSize &&
    sourcePage <= totalPages &&
    sourcePage < page + 3
  ) {
    const data = await tmdbFetch<TMDBListResponse<TMDBMultiResult>>(
      "/trending/all/day",
      {
        query: { page: sourcePage },
        revalidate: CACHE.trending,
      },
    );
    totalPages = data.total_pages;
    totalResults = data.total_results;
    const media = data.results.filter(
      (item): item is TMDBMediaResult =>
        item.media_type === "movie" || item.media_type === "tv",
    );
    const allowed = await filterAllowedMedia(media.map(mapMediaResult));
    results.push(
      ...allowed.filter(
        (item) => !filters.mediaType || item.mediaType === filters.mediaType,
      ),
    );
    sourcePage += 1;
  }

  return {
    page,
    results: results.slice(0, targetSize),
    totalPages: Math.min(totalPages, 500),
    totalResults,
  };
}

export async function getTrendingMovies(): Promise<MediaItem[]> {
  const data = await tmdbFetch<TMDBListResponse<TMDBMovie>>(
    "/trending/movie/day",
    { revalidate: CACHE.trending },
  );
  return filterAllowedMedia(data.results.map(mapMovie));
}

export async function getTrendingTVShows(): Promise<MediaItem[]> {
  const data = await tmdbFetch<TMDBListResponse<TMDBTVShow>>(
    "/trending/tv/day",
    { revalidate: CACHE.trending },
  );
  return filterAllowedMedia(
    data.results.map(mapTVShow).filter(isEditorialMedia),
  );
}

export async function getPopularMovies(): Promise<MediaItem[]> {
  const data = await tmdbFetch<TMDBListResponse<TMDBMovie>>("/discover/movie", {
    query: {
      region: "BR",
      sort_by: "popularity.desc",
      include_adult: false,
      without_keywords: BLOCKED_CONTENT_KEYWORD_QUERY,
    },
    revalidate: CACHE.popular,
  });
  return data.results.map(mapMovie);
}

export async function getPopularMoviesPage(
  page = 1,
  filters: CatalogFilters = {},
): Promise<PaginatedMedia> {
  const data = await tmdbFetch<TMDBListResponse<TMDBMovie>>("/discover/movie", {
    query: {
      ...getCatalogQuery(page, filters),
      region: "BR",
      primary_release_year: filters.year,
    },
    revalidate: CACHE.popular,
  });
  return mapPage(data, mapMovie);
}

export async function getPopularTVShows(): Promise<MediaItem[]> {
  const { start, end } = getOnAirDateRange();
  const data = await tmdbFetch<TMDBListResponse<TMDBTVShow>>("/discover/tv", {
    query: {
      "air_date.gte": start,
      "air_date.lte": end,
      "first_air_date.gte": "2022-01-01",
      "first_air_date.lte": start,
      timezone: "America/Sao_Paulo",
      sort_by: "popularity.desc",
      include_adult: false,
      without_keywords: [
        ...EXCLUDED_TV_KEYWORDS,
        ...BLOCKED_CONTENT_KEYWORDS,
      ].join("|"),
    },
    revalidate: CACHE.popular,
  });
  return data.results.map(mapTVShow).filter(isEditorialMedia);
}

export async function getOriginalTVShowsByNetwork(
  networkId: number,
): Promise<MediaItem[]> {
  const data = await tmdbFetch<TMDBListResponse<TMDBTVShow>>("/discover/tv", {
    query: {
      with_networks: networkId,
      region: "BR",
      sort_by: "popularity.desc",
      include_adult: false,
      without_keywords: [
        ...EXCLUDED_TV_KEYWORDS,
        ...BLOCKED_CONTENT_KEYWORDS,
      ].join("|"),
    },
    revalidate: CACHE.streaming,
  });

  return filterAllowedMedia(
    data.results.map(mapTVShow).filter(isEditorialMedia).slice(0, 8),
  ).then((items) => items.slice(0, 5));
}

export async function getStreamingMediaPage(
  providerId: number,
  page = 1,
  filters: CatalogFilters = {},
): Promise<PaginatedMedia> {
  const movieQuery = {
    ...getCatalogQuery(page, filters),
    with_watch_providers: providerId,
    watch_region: "BR",
    region: "BR",
    primary_release_year: filters.year,
  };
  const tvQuery = {
    ...getCatalogQuery(page, filters, "first_air_date.desc"),
    with_watch_providers: providerId,
    watch_region: "BR",
    with_genres: getTVGenre(filters.genre),
    first_air_date_year: filters.year,
    without_keywords: [
      ...EXCLUDED_TV_KEYWORDS,
      ...BLOCKED_CONTENT_KEYWORDS,
    ].join("|"),
  };

  if (filters.mediaType === "movie") {
    const data = await tmdbFetch<TMDBListResponse<TMDBMovie>>("/discover/movie", {
      query: movieQuery,
      revalidate: CACHE.streaming,
    });
    return mapPage(data, mapMovie);
  }

  if (filters.mediaType === "tv") {
    const data = await tmdbFetch<TMDBListResponse<TMDBTVShow>>("/discover/tv", {
      query: tvQuery,
      revalidate: CACHE.streaming,
    });
    const mapped = mapPage(data, mapTVShow);
    return {
      ...mapped,
      results: mapped.results.filter(isEditorialMedia),
    };
  }

  const [movies, shows] = await Promise.all([
    tmdbFetch<TMDBListResponse<TMDBMovie>>("/discover/movie", {
      query: movieQuery,
      revalidate: CACHE.streaming,
    }),
    tmdbFetch<TMDBListResponse<TMDBTVShow>>("/discover/tv", {
      query: tvQuery,
      revalidate: CACHE.streaming,
    }),
  ]);
  const results = [
    ...movies.results.map(mapMovie),
    ...shows.results.map(mapTVShow).filter(isEditorialMedia),
  ]
    .sort(
      (left, right) =>
        right.popularity - left.popularity ||
        right.voteAverage - left.voteAverage ||
        left.id - right.id,
    )
    .slice(0, 20);

  return {
    page,
    results,
    totalPages: Math.min(Math.max(movies.total_pages, shows.total_pages), 500),
    totalResults: movies.total_results + shows.total_results,
  };
}

export async function getPopularTVShowsPage(
  page = 1,
  filters: CatalogFilters = {},
): Promise<PaginatedMedia> {
  const data = await tmdbFetch<TMDBListResponse<TMDBTVShow>>("/discover/tv", {
    query: {
      ...getCatalogQuery(page, filters, "first_air_date.desc"),
      with_genres: getTVGenre(filters.genre),
      first_air_date_year: filters.year,
      without_keywords: [
        ...EXCLUDED_TV_KEYWORDS,
        ...BLOCKED_CONTENT_KEYWORDS,
      ].join("|"),
    },
    revalidate: CACHE.popular,
  });
  const mapped = mapPage(data, mapTVShow);
  return {
    ...mapped,
    results: mapped.results.filter(isEditorialMedia),
  };
}

export async function getPopularAnime(): Promise<MediaItem[]> {
  const filters = {
    with_genres: 16,
    with_original_language: "ja",
    with_origin_country: "JP",
    sort_by: "popularity.desc",
    include_adult: false,
    without_keywords: BLOCKED_CONTENT_KEYWORD_QUERY,
  };
  const [movies, shows] = await Promise.all([
    tmdbFetch<TMDBListResponse<TMDBMovie>>("/discover/movie", {
      query: { ...filters, region: "BR" },
      revalidate: CACHE.popular,
    }),
    tmdbFetch<TMDBListResponse<TMDBTVShow>>("/discover/tv", {
      query: filters,
      revalidate: CACHE.popular,
    }),
  ]);

  return [
    ...movies.results.map(mapMovie),
    ...shows.results.map(mapTVShow),
  ].sort(
    (a, b) =>
      b.popularity - a.popularity ||
      b.voteAverage - a.voteAverage ||
      a.id - b.id,
  );
}

export async function getPopularAnimePage(
  page = 1,
  filters: CatalogFilters = {},
): Promise<PaginatedMedia> {
  const movieQuery = {
    ...getCatalogQuery(page, filters),
    with_genres: filters.genre ? `16,${filters.genre}` : 16,
    with_original_language: filters.language ?? "ja",
    primary_release_year: filters.year,
  };
  const showQuery = {
    ...getCatalogQuery(page, filters, "first_air_date.desc"),
    with_genres: filters.genre ? `16,${getTVGenre(filters.genre)}` : 16,
    with_original_language: filters.language ?? "ja",
    first_air_date_year: filters.year,
    with_origin_country: "JP",
  };
  const [movies, shows] = await Promise.all([
    tmdbFetch<TMDBListResponse<TMDBMovie>>("/discover/movie", {
      query: { ...movieQuery, region: "BR" },
      revalidate: CACHE.popular,
    }),
    tmdbFetch<TMDBListResponse<TMDBTVShow>>("/discover/tv", {
      query: showQuery,
      revalidate: CACHE.popular,
    }),
  ]);
  const results = [
    ...movies.results.map(mapMovie),
    ...shows.results.map(mapTVShow),
  ]
    .sort(
      (a, b) =>
        b.popularity - a.popularity ||
        b.voteAverage - a.voteAverage ||
        a.id - b.id,
    )
    .slice(0, 20);

  return {
    page,
    results,
    totalPages: Math.min(Math.max(movies.total_pages, shows.total_pages), 500),
    totalResults: movies.total_results + shows.total_results,
  };
}

export function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  return tmdbFetch(`/movie/${movieId}`, {
    query: {
      region: "BR",
      append_to_response: "credits,videos,release_dates,keywords",
      include_video_language: "pt-BR,en-US,null",
    },
    revalidate: CACHE.details,
  });
}

export function getTVEpisodeDetails(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<TMDBTVEpisodeDetails> {
  return tmdbFetch(
    `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
    {
      query: {
        append_to_response: "credits,videos",
        include_video_language: "pt-BR,en-US,null",
      },
      revalidate: CACHE.season,
    },
  );
}

export function getTVShowDetails(tvId: number): Promise<TMDBTVShowDetails> {
  return tmdbFetch(`/tv/${tvId}`, {
    query: {
      append_to_response:
        "credits,videos,content_ratings,aggregate_credits,keywords",
      include_video_language: "pt-BR,en-US,null",
    },
    revalidate: CACHE.details,
  });
}

export function getWatchProviders(
  mediaType: MediaType,
  mediaId: number,
): Promise<TMDBWatchProvidersResponse> {
  return tmdbFetch(`/${mediaType}/${mediaId}/watch/providers`, {
    revalidate: CACHE.details,
  });
}

export function getTVSeasonDetails(
  tvId: number,
  seasonNumber: number,
): Promise<TMDBSeasonDetails> {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`, {
    revalidate: CACHE.season,
  });
}

export async function getRecommendations(
  mediaType: MediaType,
  mediaId: number,
): Promise<MediaItem[]> {
  if (mediaType === "movie") {
    const data = await tmdbFetch<TMDBListResponse<TMDBMovie>>(
      `/movie/${mediaId}/recommendations`,
      { revalidate: CACHE.recommendations },
    );
    return filterAllowedMedia(data.results.map(mapMovie));
  }

  const data = await tmdbFetch<TMDBListResponse<TMDBTVShow>>(
    `/tv/${mediaId}/recommendations`,
    { revalidate: CACHE.recommendations },
  );
  return filterAllowedMedia(
    data.results.map(mapTVShow).filter(isEditorialMedia),
  );
}

export async function getSearchResults(
  query: string,
  page = 1,
): Promise<PaginatedMedia> {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  if (!normalizedQuery) {
    return { page: 1, results: [], totalPages: 0, totalResults: 0 };
  }

  const data = await tmdbFetch<TMDBListResponse<TMDBMultiResult>>(
    "/search/multi",
    {
      query: {
        query: normalizedQuery,
        page,
        include_adult: false,
        region: "BR",
      },
      revalidate: CACHE.search,
    },
  );
  const mediaResults = data.results.filter(
    (item): item is TMDBMediaResult => item.media_type !== "person",
  );
  const mapped = mapPage(
    { ...data, results: mediaResults },
    mapMediaResult,
  );
  return {
    ...mapped,
    results: await filterAllowedMedia(mapped.results),
  };
}

export function selectFeaturedContent(
  trending: MediaItem[],
): MediaItem | null {
  const candidates = trending.filter(
    (item) =>
      item.backdropPath &&
      item.title !== "Título indisponível" &&
      item.overview &&
      item.voteCount > 0,
  );

  return (
    candidates.sort(
      (a, b) =>
        b.popularity * Math.max(b.voteAverage, 1) -
          a.popularity * Math.max(a.voteAverage, 1) || a.id - b.id,
    )[0] ?? trending[0] ?? null
  );
}

export async function getFeaturedContent(): Promise<MediaItem | null> {
  return selectFeaturedContent(await getTrendingAll());
}
