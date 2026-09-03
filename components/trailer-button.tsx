"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/interior/dialog";

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
        <Play size={16} /> Trailer
      </button>

      {trailer && (
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title={trailer.name || `Trailer — ${contentTitle}`}
          maxWidth="max-w-4xl"
        >
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0`}
              title={`Trailer de ${contentTitle}`}
              className="absolute inset-0 size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </Dialog>
      )}
    </>
  );
}
