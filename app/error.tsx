"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="catalog-state container" role="alert">
      <h1>Não foi possível carregar esta página</h1>
      <p>Ocorreu um problema inesperado. Você pode tentar novamente.</p>
      <button className="hero-button primary" onClick={reset} type="button">
        Tentar novamente
      </button>
    </main>
  );
}
