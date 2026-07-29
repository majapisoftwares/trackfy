import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "./auth-form";

type AuthMode = "login" | "register";

function AuthVisual({ mode }: { mode: AuthMode }) {
  const isLogin = mode === "login";

  return (
    <aside
      className={`auth-visual ${isLogin ? "auth-visual-login" : "auth-visual-register"}`}
      aria-label="Destaque do catálogo"
    >
      <Image
        className="auth-visual-background"
        src={
          isLogin
            ? "https://image.tmdb.org/t/p/original/uTWhbLc7Bj4qNSdW3ZvZKL8cOHv.jpg"
            : "https://image.tmdb.org/t/p/original/oKJDm4QCKbp6mR4FnxXrFlPJP8Y.jpg"
        }
        alt=""
        fill
        priority
        quality={100}
        sizes="(max-width: 820px) 0px, 50vw"
      />
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

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const isLogin = mode === "login";

  const formPanel = (
    <section className="auth-panel">
      {isLogin && (
        <Link
          className="auth-back-link"
          href="/"
          aria-label="Voltar para o início"
          title="Voltar para o início"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </Link>
      )}
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
          <AuthVisual mode={mode} />
        </>
      ) : (
        <>
          <AuthVisual mode={mode} />
          {formPanel}
        </>
      )}
    </main>
  );
}
