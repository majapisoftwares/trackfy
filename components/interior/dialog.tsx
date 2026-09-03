"use client";

import { useCallback, useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  showClose?: boolean;
};

const emptySubscribe = () => () => {};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "max-w-3xl",
  className = "",
  showClose = true,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const reduced = useReducedMotion();

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-2xl border border-white/10 bg-[#121216] text-white shadow-2xl ${className}`}
          >
            {(title || showClose) && (
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="truncate text-base font-semibold text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-0.5 truncate text-xs text-stone-400">
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={close}
                    className="-mr-1 grid size-8 place-items-center rounded-lg text-stone-400 outline-none transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Fechar"
                  >
                    <X size={18} />
                  </button>
                )}
              </header>
            )}

            <div className="p-0">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

