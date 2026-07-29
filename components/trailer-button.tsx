"use client";

import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type TrailerButtonProps = {
  contentTitle: string;
  trailer: { key: string; name: string } | null;
  className?: string;
};

export function TrailerButton({
  contentTitle,
  trailer,
  className = "detail-button",
}: TrailerButtonProps) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        className={className}
        type="button"
        disabled={!trailer}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        title={trailer ? "Assistir ao trailer" : "Trailer indisponível"}
      >
        <Play size={20} /> Trailer
      </button>

      {open && trailer && (
        <div
          className="trailer-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="trailer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trailer-modal-title"
          >
            <div className="trailer-modal-head">
              <h2 id="trailer-modal-title">{trailer.name}</h2>
              <button
                ref={closeButton}
                className="trailer-modal-close"
                type="button"
                aria-label="Fechar trailer"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" size={22} />
              </button>
            </div>
            <div className="trailer-player">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0`}
                title={`Trailer de ${contentTitle}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
