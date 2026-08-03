import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EpisodeDetail } from "@/components/episode-detail";
import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { getEpisodePageData } from "@/src/lib/tmdb/episode";

type PageProps = {
  params: Promise<{
    id: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
};

function positiveInteger(value: string): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

async function readParams(params: PageProps["params"]) {
  const values = await params;
  return {
    showId: positiveInteger(values.id),
    seasonNumber: positiveInteger(values.seasonNumber),
    episodeNumber: positiveInteger(values.episodeNumber),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { showId, seasonNumber, episodeNumber } = await readParams(params);
  if (!showId || !seasonNumber || !episodeNumber) {
    return { title: "Episódio não encontrado — Trackfy" };
  }
  const episode = await getEpisodePageData(
    showId,
    seasonNumber,
    episodeNumber,
  );
  if (!episode) return { title: "Episódio não encontrado — Trackfy" };
  return {
    title: `${episode.title} — ${episode.showTitle} — Trackfy`,
    description: episode.overview,
  };
}

export default async function EpisodePage({ params }: PageProps) {
  const { showId, seasonNumber, episodeNumber } = await readParams(params);
  if (!showId || !seasonNumber || !episodeNumber) notFound();
  const episode = await getEpisodePageData(
    showId,
    seasonNumber,
    episodeNumber,
  );
  if (!episode) notFound();

  return (
    <>
      <DashboardShell>
        <EpisodeDetail episode={episode} />
      </DashboardShell>
      <Footer />
    </>
  );
}
