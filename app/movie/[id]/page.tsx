import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/content-detail";
import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { getTMDBContentPage } from "@/src/lib/tmdb/content";

type PageProps = {
  params: Promise<{ id: string }>;
};

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: "Filme não encontrado — Trackfy" };
  const result = await getTMDBContentPage("movie", id);
  if (!result) return { title: "Filme não encontrado — Trackfy" };
  const { content } = result;
  return {
    title: `${content.title} — Trackfy`,
    description: content.synopsis[0],
  };
}

export default async function MoviePage({ params }: PageProps) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const result = await getTMDBContentPage("movie", id);
  if (!result) notFound();
  const { content, recommendations } = result;

  return (
    <>
      <DashboardShell>
        <ContentDetail content={content} recommendations={recommendations} />
      </DashboardShell>
      <Footer />
    </>
  );
}
