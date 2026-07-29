import type { MediaItem } from "@/types/media";

export const popularItems: MediaItem[] = [
  { id: 1, title: "The Odyssey", year: 2026, rating: 8.0, posterUrl: "/assets/poster-odyssey.jpg", mediaType: "movie" },
  { id: 2, title: "Silo", year: 2026, rating: 8.2, posterUrl: "/assets/poster-silo.jpg", mediaType: "tv" },
  { id: 3, title: "Disclosure Day", year: 2026, rating: 8.3, posterUrl: "/assets/poster-disclosure.jpg", mediaType: "movie" },
  { id: 4, title: "Obsession", year: 2026, rating: 8.3, posterUrl: "/assets/poster-obsession.jpg", mediaType: "tv" },
  { id: 5, title: "Backrooms", year: 2026, rating: 7.1, posterUrl: "/assets/poster-backrooms.jpg", mediaType: "movie" },
];

export const trendingItems: MediaItem[] = [
  { id: 6, title: "Agent Kim Reactivated", year: 2026, rating: 8.0, posterUrl: "/assets/poster-kim.jpg", mediaType: "tv" },
  { id: 7, title: "Lucky", year: 2026, rating: 8.2, posterUrl: "/assets/poster-lucky.jpg", mediaType: "tv" },
  { id: 8, title: "Spider-Man: Brand New Day", year: 2026, rating: 8.3, posterUrl: "/assets/poster-spiderman.jpg", mediaType: "movie" },
  { id: 9, title: "Stuart Fails to Save the Universe", year: 2026, rating: 8.3, posterUrl: "/assets/poster-stuart.jpg", mediaType: "movie" },
  { id: 10, title: "Avatar Aang: O Último Airbender", year: 2026, rating: 7.1, posterUrl: "/assets/poster-avatar.jpg", mediaType: "anime" },
];

export const topItems: MediaItem[] = [
  { id: 11, title: "House of the Dragon", year: 2026, rating: 8.0, posterUrl: "/assets/poster-hotd.jpg", mediaType: "tv", rankingPosition: 1 },
  { id: 12, title: "The Walking Dead: Dead City", year: 2026, rating: 8.2, posterUrl: "/assets/poster-deadcity.jpg", mediaType: "tv", rankingPosition: 2 },
  { ...trendingItems[0], rankingPosition: 3 },
  { ...trendingItems[1], rankingPosition: 4 },
  { ...popularItems[1], rankingPosition: 5 },
];
