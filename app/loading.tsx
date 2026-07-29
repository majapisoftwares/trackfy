export default function Loading() {
  return (
    <main className="home-loading" aria-label="Carregando catálogo">
      <div className="skeleton skeleton-hero" />
      <div className="container skeleton-stack">
        {[1, 2, 3].map((section) => (
          <section key={section}>
            <div className="skeleton skeleton-heading" />
            <div className="skeleton-row">
              {[1, 2, 3, 4, 5].map((card) => (
                <div className="skeleton skeleton-card" key={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
