import type { Metadata } from "next";
import { ContentDetail } from "@/components/content-detail";
import { DashboardShell } from "@/components/dashboard-shell";
import { Footer } from "@/components/footer";
import { getContentDetails } from "@/data/content";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const content = await getContentDetails(id);
  return {
    title: `${content.title} — Trackfy`,
    description: content.tagline,
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { id } = await params;
  const content = await getContentDetails(id);

  return (
    <>
      <DashboardShell>
        <ContentDetail content={content} />
      </DashboardShell>
      <Footer />
    </>
  );
}
