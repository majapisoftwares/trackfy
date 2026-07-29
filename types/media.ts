export type MediaType = "movie" | "tv" | "anime";

export type MediaItem = {
  id: number;
  title: string;
  year: number;
  rating: number;
  posterUrl: string;
  backdropUrl?: string;
  mediaType: MediaType;
  status?: string;
  rankingPosition?: number;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  photoUrl: string;
  episodeCount?: number;
};

export type Episode = {
  id: number;
  number: number;
  title: string;
  imageUrl: string;
  rating?: number;
  watched?: boolean;
  releaseLabel?: string;
};

export type WatchAvailability = {
  link: string;
  label: string;
  providers: Array<{
    id: number;
    name: string;
    logoUrl: string;
  }>;
};

export type ContentDetails = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  year: number;
  status: string;
  audienceScore: number;
  imdbRating: number;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  tagline: string;
  trailer: {
    key: string;
    name: string;
  } | null;
  watchAvailability: WatchAvailability | null;
  synopsis: string[];
  metadata: {
    seasons: string;
    releaseDate: string;
    certification: string;
    network: string;
  };
  cast: CastMember[];
  seasons: Array<{
    number: number;
    episodes: Episode[];
  }>;
};
