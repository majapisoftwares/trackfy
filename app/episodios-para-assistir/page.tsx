import { cookies } from "next/headers";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ContinueWatchingSection } from "@/components/continue-watching-section";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { getContinueWatchingItems } from "@/src/lib/tracking/continue-watching";
import { listTrackingEntries } from "@/src/lib/tracking/repository";

export default async function EpisodesToWatchPage() {
  const authToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
  const tracking = user
    ? await listTrackingEntries(user.ownerId, { limit: 1_000, offset: 0 })
    : { items: [] };
  const items = await getContinueWatchingItems(tracking.items);

  return (
    <>
      <main className="episodes-to-watch-page">
        <Header />
        <ContinueWatchingSection
          items={items}
          title="Episódios para assistir"
          subtitle="Continue suas séries de onde parou"
          showAll={false}
        />
      </main>
      <Footer />
    </>
  );
}
