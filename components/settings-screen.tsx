"use client";

import { Check, KeyRound, Mail, PencilLine, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { TraktImportButton } from "./trakt-import-button";

type SettingsScreenProps = {
  user: { email: string; nickname: string | null };
};

type SaveState = "idle" | "saving" | "saved" | "error";

async function saveProfile(data: Record<string, string>) {
  const response = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json() as { error?: string; user?: { email: string; nickname: string | null } };
  if (!response.ok) throw new Error(result.error || "Não foi possível salvar as alterações.");
  return result.user!;
}

export function SettingsScreen({ user }: SettingsScreenProps) {
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState(user.nickname || "");
  const [email, setEmail] = useState(user.email);
  const [profileState, setProfileState] = useState<SaveState>("idle");
  const [passwordState, setPasswordState] = useState<SaveState>("idle");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileState("saving");
    setProfileError("");
    try {
      await saveProfile({ nickname });
      await queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      setProfileState("saved");
    } catch (error) {
      setProfileState("error");
      setProfileError(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfileState("saving");
    setProfileError("");
    try {
      await saveProfile({ email, currentPassword: String(form.get("currentPassword") || "") });
      await queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      setProfileState("saved");
      event.currentTarget.reset();
    } catch (error) {
      setProfileState("error");
      setProfileError(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") || "");
    const confirmation = String(form.get("confirmation") || "");
    if (newPassword !== confirmation) {
      setPasswordState("error");
      setPasswordError("A confirmação não corresponde à nova senha.");
      return;
    }
    setPasswordState("saving");
    setPasswordError("");
    try {
      await saveProfile({ currentPassword: String(form.get("currentPassword") || ""), newPassword });
      setPasswordState("saved");
      event.currentTarget.reset();
    } catch (error) {
      setPasswordState("error");
      setPasswordError(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  return (
    <section className="settings-content container" aria-labelledby="settings-title">
      <header className="settings-heading">
        <p>Conta</p>
        <h1 id="settings-title">Configurações</h1>
        <span>Gerencie suas informações e importe seu histórico.</span>
      </header>

      <div className="settings-grid">
        <section className="settings-card settings-import" aria-labelledby="trakt-title">
          <div className="settings-card-icon"><Check aria-hidden="true" size={19} /></div>
          <div>
            <h2 id="trakt-title">Importar do Trakt</h2>
            <p>Envie os arquivos JSON exportados pelo Trakt, um de cada vez, para adicionar seu histórico à Trackfy.</p>
            <ul className="settings-import-files" aria-label="Arquivos aceitos para importação">
              <li><code>watched-movies.json</code><span>Filmes assistidos</span></li>
              <li><code>watched-shows.json</code><span>Séries e episódios assistidos</span></li>
            </ul>
            <TraktImportButton />
          </div>
        </section>

        <section className="settings-card" aria-labelledby="nickname-title">
          <div className="settings-card-icon"><UserRound aria-hidden="true" size={19} /></div>
          <div className="settings-card-body">
            <h2 id="nickname-title">Nome de exibição</h2>
            <p>É assim que seu perfil aparecerá na Trackfy.</p>
            <form onSubmit={submitProfile} className="settings-form">
              <label htmlFor="nickname">Apelido</label>
              <input id="nickname" maxLength={40} value={nickname} onChange={(event) => setNickname(event.target.value)} required />
              <button className="settings-save" disabled={profileState === "saving"} type="submit">
                <PencilLine aria-hidden="true" size={15} /> {profileState === "saving" ? "Salvando..." : "Salvar apelido"}
              </button>
              {profileState === "saved" && <p className="settings-feedback is-success" role="status">Apelido atualizado.</p>}
              {profileState === "error" && <p className="settings-feedback is-error" role="alert">{profileError}</p>}
            </form>
          </div>
        </section>

        <section className="settings-card" aria-labelledby="email-title">
          <div className="settings-card-icon"><Mail aria-hidden="true" size={19} /></div>
          <div className="settings-card-body">
            <h2 id="email-title">E-mail</h2>
            <p>Usado para acessar sua conta.</p>
            <form onSubmit={submitEmail} className="settings-form">
              <label htmlFor="email">Novo e-mail</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <label htmlFor="email-current-password">Senha atual</label>
              <input id="email-current-password" name="currentPassword" type="password" autoComplete="current-password" required />
              <button className="settings-save" disabled={profileState === "saving"} type="submit">Salvar e-mail</button>
              {profileState === "error" && <p className="settings-feedback is-error" role="alert">{profileError}</p>}
            </form>
          </div>
        </section>

        <section className="settings-card" aria-labelledby="password-title">
          <div className="settings-card-icon"><KeyRound aria-hidden="true" size={19} /></div>
          <div className="settings-card-body">
            <h2 id="password-title">Senha</h2>
            <p>Use ao menos 8 caracteres em uma senha única.</p>
            <form onSubmit={submitPassword} className="settings-form">
              <label htmlFor="password-current">Senha atual</label>
              <input id="password-current" name="currentPassword" type="password" autoComplete="current-password" required />
              <label htmlFor="password-new">Nova senha</label>
              <input id="password-new" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
              <label htmlFor="password-confirmation">Confirmar nova senha</label>
              <input id="password-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
              <button className="settings-save" disabled={passwordState === "saving"} type="submit">{passwordState === "saving" ? "Salvando..." : "Alterar senha"}</button>
              {passwordState === "saved" && <p className="settings-feedback is-success" role="status">Senha atualizada.</p>}
              {passwordState === "error" && <p className="settings-feedback is-error" role="alert">{passwordError}</p>}
            </form>
          </div>
        </section>
      </div>
    </section>
  );
}
