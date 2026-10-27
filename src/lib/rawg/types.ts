export type RawgNamedItem = {
  id: number;
  name: string;
  slug: string;
};

export type GamePlatform = RawgNamedItem;

export type GameItem = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  backgroundImage: string | null;
  rating: number | null;
  ratingsCount: number;
  metacritic: number | null;
  genres: RawgNamedItem[];
  platforms: GamePlatform[];
};

export type GameDetails = GameItem & {
  description: string | null;
  developers: RawgNamedItem[];
  publishers: RawgNamedItem[];
  website: string | null;
  screenshots: string[];
};

export type GamePage = {
  page: number;
  pageSize: number;
  count: number;
  results: GameItem[];
};

export type GameFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
  ordering?: "-added" | "-rating" | "released" | "-released";
  genres?: string;
  platforms?: string;
  dates?: string;
  metacritic?: string;
};
