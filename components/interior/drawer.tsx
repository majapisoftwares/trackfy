"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

const DISCLOSE = {
  type: "spring",
  stiffness: 150,
  damping: 27,
  mass: 1,
} as const;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

type Inertable = HTMLElement & { inert?: boolean };

type DragInfo = {
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
};

export type DrawerSide = "left" | "right";

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  side?: DrawerSide;
  width?: number;
  container?: "viewport" | "parent";
  closeLabel?: string;
  dismissOnScrimClick?: boolean;
  className?: string;
  headerClassName?: string;
  headerTitleClassName?: string;
  headerSubtitleClassName?: string;
};

const CLOSE_ICON = (
  <svg width="14" height="14" viewBox="0 0 256 256" fill="none" aria-hidden="true">
    <line
      x1="200"
      y1="56"
      x2="56"
      y2="200"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
    />
    <line
      x1="200"
      y1="200"
      x2="56"
      y2="56"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinecap="round"
    />
  </svg>
);

const emptySubscribe = () => () => {};

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  description,
  footer,
  side = "right",
  width = 380,
  container = "viewport",
  closeLabel = "Fechar painel",
  dismissOnScrimClick = true,
  className = "",
  headerClassName = "",
  headerTitleClassName = "",
  headerSubtitleClassName = "",
}: DrawerProps) {
  const titleId = useId();
  const hintId = useId();

  const [dragging, setDragging] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const sign = side === "right" ? 1 : -1;
  const away = sign * (width + 24);

  const x = useMotionValue(open ? 0 : away);
  const veil = useTransform(x, (v) => 1 - Math.min(1, Math.abs(v) / width));

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const anim = useRef<{ stop: () => void } | null>(null);
  const dismissRatio = 0.38;

  const reduced = useReducedMotion();
  const controls = useDragControls();

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const glide = useCallback(
    (to: number) => {
      anim.current?.stop();
      anim.current = animate(x, to, reduced ? { duration: 0 } : DISCLOSE);
    },
    [x, reduced],
  );

  useEffect(() => {
    glide(open ? 0 : away);
    return () => anim.current?.stop();
  }, [open, away, glide]);

  useEffect(() => {
    const panel = panelRef.current as Inertable | null;
    if (!panel) return;
    panel.inert = !open;
    return () => {
      panel.inert = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const active = document.activeElement;
      returnTo.current = active instanceof HTMLElement ? active : null;
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus({ preventScroll: true });
      return;
    }
    const target = returnTo.current;
    returnTo.current = null;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (container !== "viewport" || !open) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const padding = root.style.paddingRight;
    const gutter = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;

    return () => {
      root.style.overflow = overflow;
      root.style.paddingRight = padding;
    };
  }, [container, open]);

  useEffect(() => {
    const shell = rootRef.current;
    if (container !== "viewport" || !open || !shell) return;
    const muted: Inertable[] = [];

    for (const node of Array.from(document.body.children)) {
      if (!(node instanceof HTMLElement) || node.contains(shell)) continue;
      const el = node as Inertable;
      if (el.inert) continue;
      el.inert = true;
      muted.push(el);
    }

    return () => {
      for (const el of muted) el.inert = false;
    };
  }, [container, open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;

      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  const startDrag = useCallback(
    (event: React.PointerEvent) => {
      if (!open) return;
      controls.start(event);
    },
    [controls, open],
  );

  const onDragStart = useCallback(() => setDragging(true), []);

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: DragInfo) => {
      setDragging(false);
      const travel = sign * info.offset.x;
      const speed = sign * info.velocity.x;
      if (travel > width * dismissRatio || speed > 520) {
        close();
        return;
      }
      glide(0);
    },
    [sign, width, dismissRatio, glide, close],
  );

  const edge =
    side === "right"
      ? "right-0 rounded-l-[20px] border-l"
      : "left-0 rounded-r-[20px] border-r";

  const tree = (
    <div
      ref={rootRef}
      className={`${container === "viewport" ? "fixed" : "absolute"} inset-0 z-50 overflow-hidden ${
        open ? "" : "pointer-events-none"
      }`}
    >
      <motion.div
        aria-hidden
        style={{ opacity: veil }}
        onClick={dismissOnScrimClick ? close : undefined}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        ref={panelRef}
        aria-labelledby={titleId}
        aria-describedby={hintId}
        tabIndex={-1}
        role="dialog"
        aria-modal={container === "viewport"}
        onKeyDown={onKeyDown}
        drag="x"
        dragControls={controls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={
          side === "right"
            ? { top: 0, bottom: 0, left: 0, right: 1 }
            : { top: 0, bottom: 0, left: 1, right: 0 }
        }
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{ x, width, maxWidth: "calc(100% - 24px)", touchAction: "pan-y" }}
        className={`absolute inset-y-0 flex flex-col border-white/10 bg-[#121216] shadow-[0_28px_56px_-24px_rgba(0,0,0,0.85)] outline-none ${edge} ${
          dragging ? "select-none" : ""
        } ${className}`}
      >
        <header
          onPointerDown={startDrag}
          className={`flex select-none items-start gap-3 border-b border-white/10 px-5 py-4 ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          } ${headerClassName}`}
        >
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className={`truncate text-[15px] font-semibold text-white ${headerTitleClassName}`}
            >
              {title}
            </h2>
            {description ? (
              <p className={`mt-0.5 truncate text-[13px] text-stone-400 ${headerSubtitleClassName}`}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={close}
            aria-label={closeLabel}
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-stone-400 outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
          >
            {CLOSE_ICON}
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 dark-scrollbar">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-white/10 px-5 py-4 bg-[#121216]">
            {footer}
          </div>
        ) : null}

        <span id={hintId} className="sr-only">
          Pressione Escape para fechar este painel.
        </span>
      </motion.div>
    </div>
  );

  if (container !== "viewport") return tree;
  if (!isMounted) return null;
  return createPortal(tree, document.body);
}

