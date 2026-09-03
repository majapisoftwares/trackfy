"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const EASE = [0.23, 1, 0.32, 1] as const;
const EXIT = [0.4, 0, 1, 1] as const;
const NONE = { duration: 0 } as const;
const SLIDE = { type: "spring", stiffness: 700, damping: 46, mass: 0.5 } as const;
const ROW_H = 34;
const OPEN = { type: "spring", stiffness: 620, damping: 38, mass: 0.6 } as const;

export type DropdownMenuItem = {
  value: string;
  label: string;
  icon?: ReactNode;
  hint?: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
};

export type DropdownMenuProps = {
  items: DropdownMenuItem[];
  trigger: ReactNode;
  align?: "left" | "right";
  side?: "top" | "bottom";
  className?: string;
  label?: string;
};

export function DropdownMenu({
  items,
  trigger,
  align = "right",
  side = "top",
  className = "",
  label = "Opções",
}: DropdownMenuProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const itemId = useCallback((i: number) => `${uid}-opt-${i}`, [uid]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const viaKey = useRef(false);

  const reduced = useReducedMotion();

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    if (items.length === 0) return;
    viaKey.current = true;
    const firstEnabled = items.findIndex((it) => !it.disabled);
    setActiveIndex(firstEnabled >= 0 ? firstEnabled : 0);
    setOpen(true);
  }, [items]);

  const select = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      item.onClick?.();
      close(false);
    },
    [items, close],
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        close(false);
      }
    };
    const onWindowBlur = () => close(false);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [open, close]);

  const step = useCallback(
    (from: number, dir: 1 | -1) => {
      const n = items.length;
      if (n === 0) return -1;
      let i = from;
      for (let k = 0; k < n; k++) {
        i = (i + dir + n) % n;
        if (!items[i].disabled) return i;
      }
      return from;
    },
    [items],
  );

  const edge = useCallback(
    (dir: 1 | -1) => step(dir === 1 ? -1 : items.length, dir),
    [step, items.length],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        openMenu();
      }
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      viaKey.current = true;
      setActiveIndex((i) => step(i, dir));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      e.stopPropagation();
      viaKey.current = true;
      setActiveIndex(edge(e.key === "Home" ? 1 : -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (activeIndex >= 0) select(activeIndex);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    }
  };

  const repositionMobileMenu = useCallback(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;

    if (window.innerWidth > 640) {
      menu.style.position = "";
      menu.style.left = "";
      menu.style.top = "";
      menu.style.right = "";
      menu.style.bottom = "";
      return;
    }

    const viewportPadding = 8;
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const preferredLeft =
      align === "right"
        ? triggerRect.right - menuRect.width
        : triggerRect.left;
    const preferredTop =
      side === "top"
        ? triggerRect.top - menuRect.height - 6
        : triggerRect.bottom + 6;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - menuRect.width - viewportPadding,
    );
    const maxTop = Math.max(
      viewportPadding,
      window.innerHeight - menuRect.height - viewportPadding,
    );

    menu.style.position = "fixed";
    menu.style.left = `${Math.min(Math.max(preferredLeft, viewportPadding), maxLeft)}px`;
    menu.style.top = `${Math.min(Math.max(preferredTop, viewportPadding), maxTop)}px`;
    menu.style.right = "auto";
    menu.style.bottom = "auto";
  }, [align, side]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(repositionMobileMenu);
    window.addEventListener("resize", repositionMobileMenu);
    window.addEventListener("scroll", repositionMobileMenu, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", repositionMobileMenu);
      window.removeEventListener("scroll", repositionMobileMenu, true);
    };
  }, [open, repositionMobileMenu]);

  const isTop = side === "top";

  return (
    <div
      ref={rootRef}
      className={`interior-dropdown-root ${className}`}
      onClick={(e) => {
        // Prevent link navigation when clicking inside dropdown
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={onKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`interior-dropdown-trigger ${open ? "is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
          if (!open) {
            const firstEnabled = items.findIndex((it) => !it.disabled);
            setActiveIndex(firstEnabled >= 0 ? firstEnabled : 0);
          }
        }}
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={
              reduced
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    scale: 0.94,
                    y: isTop ? 6 : -6,
                  }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: isTop ? 4 : -4,
              transition: reduced ? NONE : { duration: 0.12, ease: EXIT },
            }}
            transition={
              reduced
                ? NONE
                : { ...OPEN, opacity: { duration: 0.12, ease: EASE } }
            }
            style={{
              transformOrigin: isTop
                ? align === "right"
                  ? "bottom right"
                  : "bottom left"
                : align === "right"
                  ? "top right"
                  : "top left",
            }}
            className={`interior-dropdown-menu ${
              isTop ? "side-top" : "side-bottom"
            } ${align === "right" ? "align-right" : "align-left"}`}
          >
            <ul
              ref={listRef}
              id={listId}
              role="menu"
              tabIndex={-1}
              aria-label={label}
              className="interior-dropdown-list"
            >
              <motion.span
                aria-hidden
                className="interior-dropdown-highlight"
                initial={false}
                animate={{
                  y: activeIndex < 0 ? 0 : activeIndex * ROW_H,
                  opacity: activeIndex < 0 ? 0 : 1,
                }}
                transition={
                  reduced
                    ? NONE
                    : { ...SLIDE, opacity: { duration: 0.1, ease: EASE } }
                }
              />
              {items.map((item, i) => {
                const active = i === activeIndex && !item.disabled;
                return (
                  <li
                    key={item.value}
                    id={itemId(i)}
                    role="menuitem"
                    aria-disabled={item.disabled ? true : undefined}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    onPointerMove={() => {
                      if (item.disabled) return;
                      viaKey.current = false;
                      setActiveIndex(i);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      select(i);
                    }}
                    className={`interior-dropdown-item ${
                      item.disabled
                        ? "is-disabled"
                        : active
                          ? "is-active"
                          : ""
                    } ${item.active ? "is-selected" : ""}`}
                  >
                    {item.icon && (
                      <span className="interior-dropdown-item-icon">
                        {item.icon}
                      </span>
                    )}
                    <span className="interior-dropdown-item-label">
                      {item.label}
                    </span>
                    {item.hint && (
                      <span className="interior-dropdown-item-hint">
                        {item.hint}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
