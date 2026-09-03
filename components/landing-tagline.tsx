"use client";

import { useEffect, useRef } from "react";

const words = "Toda sessão começa com uma escolha que já está esperando por você.".split(" ");

export function LandingTagline() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) element.classList.add("is-visible");
    }, { threshold: 0.45 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <section className="trackfy-tagline" ref={ref} aria-label="Benefício principal"><p>{words.map((word, index) => <span key={`${word}-${index}`} style={{ transitionDelay: `${index * 75}ms` }}>{word} </span>)}</p></section>;
}
