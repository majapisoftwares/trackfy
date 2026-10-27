"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";

type ImportSummary = {
  imported: number;
  duplicates: number;
  notFound: number;
  invalid: number;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function ImdbImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importList(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSummary(null);
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError("O arquivo deve ter no máximo 2 MB.");
      return;
    }

    const csv = await file.text();
    if (!csv.trim()) {
      setError("Selecione um arquivo CSV exportado pelo IMDb.");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/imports/imdb", {
        method: "POST",
        headers: { "Content-Type": "text/csv;charset=UTF-8" },
        body: csv,
      });
      const result = (await response.json()) as ImportSummary & { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível importar a lista.");
      setSummary(result);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível importar a lista.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className={`imdb-import${summary || error ? " has-feedback" : ""}`}>
      <button
        className="imdb-import-button"
        type="button"
        disabled={isImporting}
        onClick={() => inputRef.current?.click()}
      >
        <Upload aria-hidden="true" size={16} />
        {isImporting ? "Importando..." : "Importar do IMDb"}
      </button>
      <input
        ref={inputRef}
        className="imdb-import-input"
        type="file"
        accept="text/csv,.csv"
        aria-label="Selecionar lista exportada do IMDb"
        tabIndex={-1}
        onChange={importList}
      />
      {summary && (
        <p className="imdb-import-result" role="status">
          {summary.imported} importado{summary.imported === 1 ? "" : "s"}, {summary.duplicates} já existente{summary.duplicates === 1 ? "" : "s"} e {summary.notFound} não encontrado{summary.notFound === 1 ? "" : "s"}.
          {summary.invalid > 0 ? ` ${summary.invalid} item(ns) inválido(s) foram ignorados.` : ""}
        </p>
      )}
      {error && <p className="imdb-import-result is-error" role="alert">{error}</p>}
    </div>
  );
}
