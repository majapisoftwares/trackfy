import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { JikanFullmetalDetail } from "@/components/jikan-fullmetal-detail";

export const metadata = {
  title: "Fullmetal Alchemist: Brotherhood — Trackfy",
  description: "Detalhes de Fullmetal Alchemist: Brotherhood fornecidos pela Jikan e MyAnimeList.",
};

export default function FullmetalAlchemistBrotherhoodPage() {
  return (
    <>
      <DashboardShell wide>
        <JikanFullmetalDetail />
      </DashboardShell>
      <Footer />
    </>
  );
}
