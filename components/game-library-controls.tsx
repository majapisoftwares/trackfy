"use client";

import Link from "next/link";
import { Check, LogIn, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/src/lib/auth/client";
import { GAME_STATUSES, GAME_STATUS_LABELS, type UserGame } from "@/src/lib/games/types";
import type { GameItem } from "@/src/lib/rawg/types";

type Payload = { item: UserGame | null; error?: string };
async function read(response: Response): Promise<Payload> { const payload = await response.json() as Payload; if (!response.ok) throw new Error(payload.error || "Não foi possível salvar seu jogo."); return payload; }

export function GameLibraryControls({ game }: { game: GameItem }) {
  const session = useAuthSession();
  if (!session.data?.user) return <Link className="detail-button primary" href="/login"><LogIn size={16} />Entrar para acompanhar</Link>;
  return <GameLibraryEditor game={game} />;
}

function GameLibraryEditor({ game }: { game: GameItem }) {
  const [entry, setEntry] = useState<UserGame | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; fetch(`/api/games/library/${game.id}`, { credentials: "same-origin" }).then(read).then((data) => active && setEntry(data.item)).catch(() => active && setError("Não foi possível carregar seu progresso.")).finally(() => active && setLoading(false)); return () => { active = false; }; }, [game.id]);
  const save = async (values: Record<string, unknown>) => { setSaving(true); setError(null); try { const data = await read(await fetch(`/api/games/library/${game.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ slug: game.slug, name: game.name, coverUrl: game.backgroundImage, ...values }) })); setEntry(data.item); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar seu jogo."); } finally { setSaving(false); } };
  const remove = async () => { setSaving(true); setError(null); try { const response = await fetch(`/api/games/library/${game.id}`, { method: "DELETE", credentials: "same-origin" }); if (!response.ok) throw new Error("Não foi possível remover o jogo."); setEntry(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível remover o jogo."); } finally { setSaving(false); } };
  if (loading) return <span className="game-controls-loading">Carregando biblioteca...</span>;
  return <div className="game-library-controls">
    <div className="game-status-actions" aria-label="Status rápido do jogo">
      <button className={`detail-button ${entry?.status === "playing" ? "primary active" : ""}`} type="button" onClick={() => void save({ status: "playing" })} disabled={saving}><Play size={16} fill="currentColor" />Jogando</button>
      <button className={`detail-button ${entry?.status === "wishlist" ? "primary active" : ""}`} type="button" onClick={() => void save({ status: "wishlist" })} disabled={saving}>{entry?.status === "wishlist" ? <Check size={16} /> : <Plus size={16} />}Quero jogar</button>
    </div>
    {entry && entry.status !== "wishlist" && <>
      <div className="game-status-row"><label>Outros status<select value="" disabled={saving} onChange={(event) => event.target.value && void save({ status: event.target.value })}><option value="" disabled>Alterar status</option>{GAME_STATUSES.filter((status) => status !== "playing" && status !== "wishlist").map((status) => <option key={status} value={status}>{GAME_STATUS_LABELS[status]}</option>)}</select></label><button className="game-remove-button" type="button" disabled={saving} onClick={() => void remove()} aria-label="Remover da biblioteca"><Trash2 size={16} /></button></div>
      <div className="game-personal-fields">
        <label>Nota<select value={entry.personalRating ?? ""} disabled={saving} onChange={(event) => void save({ personalRating: event.target.value ? Number(event.target.value) : null })}><option value="">Sem nota</option>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value} estrela{value > 1 ? "s" : ""}</option>)}</select></label>
        <label>Plataforma<input value={entry.platform ?? ""} disabled={saving} maxLength={120} onBlur={(event) => { if (event.target.value !== (entry.platform ?? "")) void save({ platform: event.target.value || null }); }} placeholder="Ex.: PC" /></label>
        <label>Horas jogadas<input type="number" min="0" max="100000" step="0.5" defaultValue={entry.hoursPlayed ?? ""} disabled={saving} onBlur={(event) => { const value = event.target.value; if (value !== String(entry.hoursPlayed ?? "")) void save({ hoursPlayed: value ? Number(value) : null }); }} /></label>
        <label>Concluído em<input type="date" defaultValue={entry.completedAt?.slice(0, 10) ?? ""} disabled={saving} onChange={(event) => void save({ completedAt: event.target.value || null })} /></label>
      </div>
      {entry.status === "completed" && <span className="game-completed-badge"><Check size={14} /> Finalizado</span>}
    </>}
    {error && <p className="tracking-error" role="status">{error}</p>}
  </div>;
}
