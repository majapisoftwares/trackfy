"use client";

import { Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

type ImportSummary = {
  imported: number;
  duplicates: number;
  notFound: number;
  invalid: number;
};

export function TraktImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSummary(null);
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 5 MB.");
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      setError("Selecione um arquivo JSON válido exportado pelo Trakt.");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/imports/trakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, sourceName: file.name }),
      });
      const result = (await response.json()) as ImportSummary & { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível importar o arquivo.");
      setSummary(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível importar o arquivo.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="trakt-import">
      <button
        className="trakt-import-button"
        type="button"
        disabled={isImporting}
        onClick={() => inputRef.current?.click()}
      >
        <Upload aria-hidden="true" size={16} />
        {isImporting ? "Importando..." : "Importar do Trakt"}
      </button>
      <input
        ref={inputRef}
        className="trakt-import-input"
        type="file"
        accept="application/json,.json"
        aria-label="Selecionar exportação do Trakt"
        tabIndex={-1}
        onChange={importBackup}
      />
      {summary && (
        <p className="trakt-import-result" role="status">
          {summary.imported} importado{summary.imported === 1 ? "" : "s"}, {summary.duplicates} já existente{summary.duplicates === 1 ? "" : "s"} e {summary.notFound} não encontrado{summary.notFound === 1 ? "" : "s"}.
          {summary.invalid > 0 ? ` ${summary.invalid} item(ns) inválido(s) foram ignorados.` : ""}
        </p>
      )}
      {error && <p className="trakt-import-result is-error" role="alert">{error}</p>}
    </div>
  );
}
