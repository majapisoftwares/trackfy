import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { GameDetail } from "@/components/game-detail";
import { getGameDetails, getGamesPage } from "@/src/lib/rawg/endpoints";

export const revalidate = 1800;
export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameDetails(slug).catch(() => null);
  if (!game) notFound();
  const related = game.genres[0]
    ? await getGamesPage({ genres: game.genres[0].slug, ordering: "-rating", pageSize: 8 })
      .then((page) => page.results.filter((item) => item.id !== game.id))
      .catch(() => [])
    : [];
  return <><DashboardShell wide><GameDetail game={game} related={related} /></DashboardShell><Footer /></>;
}
