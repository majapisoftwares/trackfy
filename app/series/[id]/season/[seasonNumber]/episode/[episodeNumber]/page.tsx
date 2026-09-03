import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
};

export default async function EpisodePage({ params }: PageProps) {
  const { id, seasonNumber, episodeNumber } = await params;
  redirect(`/series/${id}?season=${seasonNumber}&episode=${episodeNumber}`);
}
