"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "register";

type AuthErrorResponse = {
  error?: string;
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        isLogin ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            ...(isLogin ? {} : { termsAccepted }),
          }),
        },
      );
      const payload = (await response.json()) as AuthErrorResponse;

      if (!response.ok) {
        setMessage(payload.error || "Não foi possível concluir a solicitação.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-fields">
        <label className="auth-field">
          <span>E-mail</span>
          <span className="auth-input-shell">
            <Image
              aria-hidden="true"
              src="/assets/auth/email-icon.svg"
              alt=""
              width={20}
              height={20}
            />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(message)}
              required
            />
          </span>
        </label>

        <label className="auth-field">
          <span>Senha</span>
          <span className="auth-input-shell">
            <Image
              aria-hidden="true"
              src="/assets/auth/password-icon.svg"
              alt=""
              width={20}
              height={20}
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              maxLength={128}
              aria-describedby={isLogin ? undefined : "password-help"}
              aria-invalid={Boolean(message)}
              required
            />
          </span>
          {!isLogin && (
            <small className="auth-field-help" id="password-help">
              Use pelo menos 8 caracteres.
            </small>
          )}
        </label>
      </div>

      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
      </button>

      {!isLogin && (
        <label className="auth-terms">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            required
          />
          <span>
            Aceitar os <u>termos de condições</u>
          </span>
        </label>
      )}

      {message && (
        <p className="auth-message" role="alert">
          {message}
        </p>
      )}

      {isLogin && (
        <div className="auth-secondary-actions">
          <p>
            Não tem uma conta?{" "}
            <Link href="/criar-conta">Crie agora</Link>
          </p>
          <button
            type="button"
            onClick={() =>
              setMessage(
                "A recuperação de senha ainda não está disponível.",
              )
            }
          >
            Esqueceu sua senha?
          </button>
        </div>
      )}
    </form>
  );
}
