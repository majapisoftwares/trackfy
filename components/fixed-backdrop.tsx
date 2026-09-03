"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

export interface FixedBackdropProps {
  backdropUrl?: string | null;
  activeId?: number | string;
  backdropPosition?: string;
  className?: string;
  fullBlur?: boolean;
}

export function FixedBackdrop({
  backdropUrl,
  activeId = "default",
  backdropPosition,
  className = "",
  fullBlur = false,
}: FixedBackdropProps) {
  const [scrollBlurProgress, setScrollBlurProgress] = useState(0);

  useEffect(() => {
    if (fullBlur) return;
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Progress from 0 (at top) to 1 (when scrolled 300px)
          const progress = Math.min(Math.max(scrollY / 300, 0), 1);
          setScrollBlurProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fullBlur]);

  const blurProgress = fullBlur ? 1 : scrollBlurProgress;
  const blurAmount = Math.round(blurProgress * 28);
  const bottomBlurAmount = Math.round(Math.max(blurAmount, 26 + blurProgress * 6));
  const scaleAmount = (1.02 + blurProgress * 0.08).toFixed(3);
  const brightnessAmount = (0.92 - blurProgress * 0.2).toFixed(2);
  const saturationAmount = (1.05 + blurProgress * 0.3).toFixed(2);

  return (
    <div
      className={`hero-fixed-backdrop ${blurProgress > 0 ? "is-scrolled" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="hero-backdrop-base" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={activeId ?? "default"}
          className="hero-backdrop-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: "easeInOut" }}
        >
          {backdropUrl ? (
            <>
              <Image
                className="hero-backdrop-img"
                src={backdropUrl}
                alt=""
                fill
                sizes="100vw"
                quality={90}
                priority
                style={{
                  objectFit: "cover",
                  objectPosition: backdropPosition || "center 20%",
                  filter: `blur(${blurAmount}px) saturate(${saturationAmount}) brightness(${brightnessAmount})`,
                  transform: `scale(${scaleAmount})`,
                  transition: "filter 120ms ease-out, transform 120ms ease-out",
                  pointerEvents: "none",
                }}
              />
              <Image
                className="hero-backdrop-img hero-backdrop-blur-bottom"
                src={backdropUrl}
                alt=""
                fill
                sizes="100vw"
                quality={90}
                priority
                style={{
                  objectFit: "cover",
                  objectPosition: backdropPosition || "center 20%",
                  filter: `blur(${bottomBlurAmount}px) saturate(${saturationAmount}) brightness(${brightnessAmount})`,
                  transform: `scale(${scaleAmount})`,
                  transition: "filter 120ms ease-out, transform 120ms ease-out",
                  pointerEvents: "none",
                }}
              />
            </>
          ) : (
            <div className="hero-backdrop-placeholder" />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="hero-gradient-overlay" />
      <div className="hero-vignette-overlay" />
    </div>
  );
}

