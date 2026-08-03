import { cookies } from "next/headers";
import { Footer } from "@/components/footer";
import { DashboardShell } from "@/components/dashboard-shell";
import { UpcomingEpisodesSection } from "@/components/upcoming-episodes-section";
import { findAuthUserBySessionToken } from "@/src/lib/auth/repository";
import { AUTH_COOKIE_NAME } from "@/src/lib/auth/session";
import { getUpcomingEpisodeItems } from "@/src/lib/tracking/upcoming-episodes";
import { listTrackingEntries } from "@/src/lib/tracking/repository";

export default async function EpisodesToWatchPage() {
  const authToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = authToken ? await findAuthUserBySessionToken(authToken) : null;
  const tracking = user
    ? await listTrackingEntries(user.ownerId, { limit: 1_000, offset: 0 })
    : { items: [] };
  const items = await getUpcomingEpisodeItems(tracking.items);

  return (
    <>
      <DashboardShell>
        <section className="episodes-to-watch-page">
          {items.length > 0 ? (
            <UpcomingEpisodesSection items={items} />
          ) : (
            <section className="content-section container">
              <div className="section-head">
                <div>
                  <h1 className="section-title">Próximos episódios</h1>
                  <p className="section-subtitle">Acompanhe os próximos lançamentos das séries que você assiste</p>
                </div>
              </div>
              <p className="section-empty">Nenhum episódio futuro encontrado nas séries que você acompanha.</p>
            </section>
          )}
        </section>
      </DashboardShell>
      <Footer />
    </>
  );
}
