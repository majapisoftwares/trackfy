import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import { getPopularMovies } from "@/src/lib/tmdb/endpoints";
import { AuthForm } from "./auth-form";

type AuthMode = "login" | "register";

function AuthVisual({
  mode,
  backgroundUrl,
}: {
  mode: AuthMode;
  backgroundUrl: string | null;
}) {
  const isLogin = mode === "login";

  return (
    <aside
      className={`auth-visual ${isLogin ? "auth-visual-login" : "auth-visual-register"}`}
      aria-label="Destaque do catálogo"
    >
      {backgroundUrl && (
        <Image
          className="auth-visual-background"
          src={backgroundUrl}
          alt=""
          fill
          priority
          quality={95}
          sizes="(max-width: 820px) 0px, 50vw"
        />
      )}
      <div className="auth-visual-overlay" />
      <div className="auth-visual-content">
        <Link
          className="auth-brand"
          href="/"
          aria-label="Trackfy — início"
        >
          <Image
            src="/assets/logo-trackfy.svg"
            alt=""
            width={116}
            height={35}
            priority
          />
        </Link>
        <p className="auth-visual-copy">
          <strong>Animes, Seriados e Filmes</strong>
          <span>
            Em um único <strong>lugar.</strong>
          </span>
        </p>
      </div>
    </aside>
  );
}

export async function AuthScreen({ mode }: { mode: AuthMode }) {
  const isLogin = mode === "login";
  const popular = await getPopularMovies().catch(() => []);
  const backgroundUrl = getTMDBImageUrl(
    popular.find((item, index) => index === (isLogin ? 0 : 1) && item.backdropPath)
      ?.backdropPath ?? popular.find((item) => item.backdropPath)?.backdropPath,
    "w1280",
  );

  const formPanel = (
    <section className="auth-panel">
      <Link
        className="auth-back-link"
        href="/"
        aria-label="Voltar para o início"
        title="Voltar para o início"
      >
        <ArrowLeft aria-hidden="true" size={18} />
      </Link>
      <div className="auth-panel-inner">
        <header className="auth-heading">
          <h1>{isLogin ? "Acesse sua conta" : "Crie sua conta"}</h1>
          <p>
            {isLogin
              ? "Entre na sua conta para começar."
              : "Crie uma conta para começar."}
          </p>
        </header>
        <AuthForm mode={mode} />
      </div>
    </section>
  );

  return (
    <main className={`auth-page auth-page-${mode}`}>
      {isLogin ? (
        <>
          {formPanel}
          <AuthVisual mode={mode} backgroundUrl={backgroundUrl} />
        </>
      ) : (
        <>
          <AuthVisual mode={mode} backgroundUrl={backgroundUrl} />
          {formPanel}
        </>
      )}
    </main>
  );
}
