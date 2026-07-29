"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, LoaderCircle, Search } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getTMDBImageUrl } from "@/src/lib/tmdb/image";
import type { MediaItem, PaginatedMedia } from "@/src/lib/tmdb/types";

export function SearchInput() {
  const router = useRouter();
  const searchRootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim();

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!searchRootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({ query: normalizedQuery });
        const response = await fetch(`/api/tmdb/search?${searchParams}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("A pesquisa não pôde ser concluída.");

        const data = (await response.json()) as PaginatedMedia;
        setResults(data.results.slice(0, 6));
        if (searchRootRef.current?.contains(document.activeElement)) {
          setOpen(true);
        }
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") {
          return;
        }
        setResults([]);
        setError("Não foi possível pesquisar agora.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpen(value.trim().length >= 2);
    setResults([]);
    setError(null);

    if (value.trim().length >= 2) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstResult = results[0];
    if (!firstResult) return;

    setOpen(false);
    router.push(
      firstResult.mediaType === "movie"
        ? `/movie/${firstResult.id}`
        : `/series/${firstResult.id}`,
    );
  }

  return (
    <div className="search-wrap" ref={searchRootRef}>
      <form className="search-form" role="search" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="catalog-search">
          Pesquisar séries e filmes pelo nome
        </label>
        <input
          aria-autocomplete="list"
          aria-controls="catalog-search-results"
          autoComplete="off"
          className="search-input"
          id="catalog-search"
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => normalizedQuery.length >= 2 && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Pesquisar séries e filmes pelo nome..."
        />
        <button
          className="search-submit"
          type="submit"
          aria-label="Abrir primeiro resultado da pesquisa"
          disabled={!results.length}
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="search-loader" />
          ) : (
            <Search aria-hidden="true" strokeWidth={1.8} />
          )}
        </button>
      </form>

      {open && normalizedQuery.length >= 2 && (
        <div
          aria-live="polite"
          className="search-results"
          id="catalog-search-results"
        >
          {loading && results.length === 0 ? (
            <p className="search-message">Pesquisando...</p>
          ) : error ? (
            <p className="search-message search-error">{error}</p>
          ) : results.length === 0 ? (
            <p className="search-message">Nenhum filme ou série encontrado.</p>
          ) : (
            <ul>
              {results.map((item) => {
                const href =
                  item.mediaType === "movie"
                    ? `/movie/${item.id}`
                    : `/series/${item.id}`;
                const posterUrl = getTMDBImageUrl(item.posterPath, "w342");

                return (
                  <li key={`${item.mediaType}-${item.id}`}>
                    <Link
                      className="search-result"
                      href={href}
                      onClick={() => setOpen(false)}
                    >
                      <span className="search-result-poster">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt=""
                            fill
                            sizes="42px"
                          />
                        ) : (
                          <Film aria-hidden="true" size={18} />
                        )}
                      </span>
                      <span className="search-result-copy">
                        <strong>{item.title}</strong>
                        <small>
                          {item.year ?? "Data indisponível"} ·{" "}
                          {item.mediaType === "movie" ? "Filme" : "Série"}
                        </small>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
