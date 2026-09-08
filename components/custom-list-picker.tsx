"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Plus } from "lucide-react";
import { Dialog } from "./interior/dialog";
import type { TrackingMediaType } from "@/src/lib/tracking/types";

type List = { id: string; name: string };
type Props = { open: boolean; onOpenChange: (open: boolean) => void; mediaType: TrackingMediaType; mediaId: number; title: string; posterUrl: string | null; onDefaultSave: () => void };

export function CustomListPicker({ open, onOpenChange, mediaType, mediaId, title, posterUrl, onDefaultSave }: Props) {
  const [lists, setLists] = useState<List[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/lists", { credentials: "same-origin" }).then((response) => response.json()).then((data) => setLists(data.items ?? [])).catch(() => setError("Não foi possível carregar suas listas."));
  }, [open]);

  async function createList() {
    if (!name.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }), credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLists((current) => [...current, data.item]); setName("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a lista."); }
    finally { setBusy(false); }
  }

  async function saveToList(listId: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/lists/${listId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaType, mediaId, title, posterUrl }), credentials: "same-origin" });
      if (!response.ok) throw new Error("Não foi possível salvar nesta lista.");
      onOpenChange(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar nesta lista."); }
    finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange} title="Salvar conteúdo" description={title} maxWidth="max-w-md">
    <div className="custom-list-picker">
      <button type="button" className="custom-list-option" disabled={busy} onClick={() => { onDefaultSave(); onOpenChange(false); }}><span><Bookmark size={18} /><b>Minha lista</b></span><Check size={17} /></button>
      {lists.map((list) => <button type="button" className="custom-list-option" disabled={busy} key={list.id} onClick={() => saveToList(list.id)}><span><Bookmark size={18} /><b>{list.name}</b></span><Plus size={17} /></button>)}
      <div className="custom-list-create"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createList(); }} placeholder="Nome da nova lista" maxLength={60} /><button type="button" disabled={busy || !name.trim()} onClick={() => void createList()}><Plus size={16} /> Criar lista</button></div>
      {error && <p className="custom-list-error" role="alert">{error}</p>}
    </div>
  </Dialog>;
}
