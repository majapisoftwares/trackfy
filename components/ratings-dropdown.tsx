"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ExternalLink, LayoutGrid, Loader2, X } from "lucide-react";

export type RatingsDropdownProps = {
  tmdbId: number;
  title?: string;
  mediaType?: "tv" | "movie";
  className?: string;
};

export function RatingsDropdown({
  tmdbId,
  title,
  mediaType = "tv",
  className = "",
}: RatingsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const seriesGraphUrl = `https://seriesgraph.com/show/${tmdbId}`;

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={`ratings-dropdown-root ${className}`}>
      <button
        type="button"
        className={`episode-toolbar-btn ${open ? "is-active" : ""}`}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) setLoading(true);
            return next;
          });
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Ver gráfico de avaliações do SeriesGraph"
      >
        <LayoutGrid size={15} />
        <span>Avaliações</span>
        <ChevronDown
          size={13}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={
              reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }
            }
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="ratings-dropdown-panel"
            role="dialog"
            aria-label="Gráfico de Avaliações SeriesGraph"
          >
            <div className="ratings-dropdown-header">
              <div className="ratings-dropdown-title">
                <LayoutGrid size={15} />
                <span>
                  SeriesGraph {title ? `— ${title}` : "— Avaliações"}
                </span>
              </div>
              <div className="ratings-dropdown-actions">
                <a
                  href={seriesGraphUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ratings-header-btn"
                  title="Abrir no site oficial do SeriesGraph"
                >
                  <ExternalLink size={13} />
                  <span>Abrir em nova aba</span>
                </a>
                <button
                  type="button"
                  className="ratings-header-btn close"
                  onClick={close}
                  aria-label="Fechar"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="ratings-dropdown-content">
              {loading && (
                <div className="ratings-dropdown-loading">
                  <Loader2 size={24} className="animate-spin text-zinc-400" />
                  <span>Carregando gráfico de notas do SeriesGraph...</span>
                </div>
              )}
              <iframe
                src={seriesGraphUrl}
                title={`Gráfico de episódios de ${title || "série"} no SeriesGraph`}
                className={`ratings-dropdown-iframe ${loading ? "is-loading" : "is-loaded"}`}
                onLoad={() => setLoading(false)}
                loading="lazy"
                allow="fullscreen"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
