import { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { SearchScreen } from "@/components/search-screen";
import { getTrendingAllPage } from "@/src/lib/tmdb/endpoints";

export const metadata: Metadata = {
  title: "Pesquisar | Trackfy",
  description: "Pesquise séries, filmes e animes no Trackfy.",
};

export default async function SearchPage() {
  const trending = await getTrendingAllPage(1).catch(() => ({
    page: 1,
    results: [],
    totalPages: 1,
    totalResults: 0,
  }));

  return (
    <>
      <DashboardShell wide>
        <section className="search-page-layout container">
          <SearchScreen
            initialMedia={trending.results}
            initialTotalPages={trending.totalPages}
          />
        </section>
      </DashboardShell>
      <Footer />
    </>
  );
}

