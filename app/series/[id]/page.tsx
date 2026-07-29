import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/content-detail";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
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
  if (!id) return { title: "Série não encontrada — Trackfy" };
  const result = await getTMDBContentPage("tv", id);
  if (!result) return { title: "Série não encontrada — Trackfy" };
  const { content } = result;
  return {
    title: `${content.title} — Trackfy`,
    description: content.synopsis[0],
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const result = await getTMDBContentPage("tv", id);
  if (!result) notFound();
  const { content, recommendations } = result;

  return (
    <>
      <div className="detail-header-wrap"><Header /></div>
      <ContentDetail content={content} recommendations={recommendations} />
      <Footer />
    </>
  );
}
