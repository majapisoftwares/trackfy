export const STREAMING_PROVIDERS = {
  netflix: { name: "Netflix", tmdbProviderId: 8 },
  "prime-video": { name: "Prime Video", tmdbProviderId: 119 },
  "disney-plus": { name: "Disney+", tmdbProviderId: 337 },
  "apple-tv-plus": { name: "Apple TV+", tmdbProviderId: 350 },
  "paramount-plus": { name: "Paramount+", tmdbProviderId: 531 },
} as const;

export type StreamingProviderSlug = keyof typeof STREAMING_PROVIDERS;

export function isStreamingProviderSlug(
  value: string,
): value is StreamingProviderSlug {
  return value in STREAMING_PROVIDERS;
}
