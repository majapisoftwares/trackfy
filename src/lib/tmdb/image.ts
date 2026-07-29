const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export type TMDBImageSize = "w342" | "w500" | "w780" | "w1280" | "original";

export function getTMDBImageUrl(
  path: string | null | undefined,
  size: TMDBImageSize = "w500",
): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("/assets/")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${normalizedPath}`;
}
