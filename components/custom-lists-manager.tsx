"use client";

import { useEffect, useState } from "react";
import { ListPlus, Plus } from "lucide-react";
import Link from "next/link";

type List = { id: string; name: string; items: unknown[] };

export function CustomListsManager({ selectedListId }: { selectedListId?: string }) {
  const [lists, setLists] = useState<List[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/lists", { credentials: "same-origin" }).then((response) => response.json()).then((data) => setLists(data.items ?? []));
  }, []);

  async function createList() {
    const value = name.trim();
    if (!value) return;
    const response = await fetch("/api/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: value }), credentials: "same-origin" });
    if (!response.ok) return;
    const data = await response.json();
    setLists((current) => [...current, data.item]); setName(""); setOpen(false);
  }

  return <section className="custom-lists-manager" aria-labelledby="custom-lists-title">
    <div className="custom-lists-heading"><div><h2 id="custom-lists-title">Listas criadas</h2></div><div className="custom-lists-actions"><button type="button" onClick={() => setOpen((value) => !value)}><ListPlus size={17} /> Nova lista</button></div></div>
    {open && <div className="custom-list-create custom-list-create-page"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createList(); }} placeholder="Nome da lista" maxLength={60} autoFocus /><button type="button" disabled={!name.trim()} onClick={() => void createList()}><Plus size={16} /> Criar</button></div>}
    {lists.length > 0 && <div className="custom-lists-chips">{lists.map((list) => <Link className={selectedListId === list.id ? "is-selected" : ""} href={`/minha-lista?list=${encodeURIComponent(list.id)}`} key={list.id}>{list.name} <small>({list.items.length})</small></Link>)}</div>}
  </section>;
}
