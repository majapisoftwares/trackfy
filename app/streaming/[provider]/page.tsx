import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogSearchParams } from "@/src/lib/catalog-query";
import {
  isStreamingProviderSlug,
  STREAMING_PROVIDERS,
} from "@/src/lib/streaming";
import { getStreamingMediaPage } from "@/src/lib/tmdb/endpoints";

type StreamingPageProps = {
  params: Promise<{ provider: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StreamingPage({
  params,
  searchParams,
}: StreamingPageProps) {
  const { provider: providerSlug } = await params;
  if (!isStreamingProviderSlug(providerSlug)) notFound();

  const provider = STREAMING_PROVIDERS[providerSlug];
  const { page, filters, values } = parseCatalogSearchParams(
    await searchParams,
  );
  const data = await getStreamingMediaPage(
    provider.tmdbProviderId,
    page,
    filters,
  );

  return (
    <CatalogPage
      title={provider.name}
      subtitle={`Filmes e séries disponíveis no ${provider.name}.`}
      items={data.results}
      currentPage={data.page}
      totalPages={data.totalPages}
      filters={values}
      showMediaTypeFilter
    />
  );
}
