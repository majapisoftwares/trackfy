"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const image = (path: string, size = "w780") => `https://image.tmdb.org/t/p/${size}${path}`;

const posters = [
  { title: "Severance", path: "/uFQduVgF5QHlVFXEhAt47b8N9dN.jpg" },
  { title: "The Last of Us", path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg" },
  { title: "Arcane", path: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg" },
  { title: "Duna: Parte Dois", path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
  { title: "Solo Leveling", path: "/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg" },
  { title: "The Bear", path: "/sHFlb5j9TvP2ufWxLp8doX8XOl1.jpg" },
];

const steps = [
  ["Adicione", "Uma série entra na sua biblioteca."],
  ["Acompanhe", "Marque o episódio que acabou de assistir."],
  ["Retome", "O próximo sempre fica à sua espera."],
];

const questions = [
  ["O Trackfy é um serviço de streaming?", "Não. O Trackfy não reproduz filmes, séries ou animes. Ele ajuda você a descobrir, organizar e acompanhar o que está assistindo."],
  ["Posso acompanhar séries e animes?", "Sim. Sua biblioteca reúne séries, filmes e animes em um único lugar."],
  ["Consigo marcar episódios como assistidos?", "Sim. Marque episódios e temporadas para que seu progresso fique sempre atualizado."],
  ["O Trackfy mostra o próximo episódio?", "Sim. A plataforma organiza seus conteúdos em andamento e deixa claro o que vem depois."],
  ["Preciso criar uma conta?", "Você cria uma conta para guardar sua biblioteca e levar seu progresso entre dispositivos."],
  ["O Trackfy é gratuito?", "Sim. Você pode começar a organizar o que assiste sem cartão de crédito."],
];

function Poster({ title, path, priority = false }: { title: string; path: string; priority?: boolean }) {
  return <Image src={image(path, "w500")} alt={`Pôster de ${title}`} fill sizes="(max-width: 700px) 30vw, 180px" priority={priority} />;
}

function AppWindow({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={`showcase-window ${compact ? "is-compact" : ""} ${className}`}>
      <div className="showcase-window-bar"><Image src="/assets/logo-mark.svg" alt="" width={19} height={19} /><span>Início</span><i /><span className="showcase-search">Buscar filmes, séries e animes</span><b>V</b></div>
      <div className="showcase-window-content">
        <div className="showcase-welcome"><span>Boa noite, Vitor</span><strong>Continue de onde parou.</strong></div>
        <div className="showcase-featured">
          <div className="showcase-feature-image"><Poster title="Severance" path={posters[0].path} priority /></div>
          <div><small>Série · 2 temporadas</small><h3>Severance</h3><p>Temporada 2 · Episódio 06</p><div className="showcase-progress"><i /><span>6 de 10 episódios</span></div><button type="button"><Check size={13} /> Episódio assistido</button></div>
        </div>
        <div className="showcase-row-title"><strong>Em andamento</strong><span>Ver todos</span></div>
        <div className="showcase-poster-row">{posters.slice(1, 5).map((poster) => <div className="showcase-poster" key={poster.title}><Poster {...poster} /></div>)}</div>
      </div>
    </div>
  );
}

export function TrackfyLanding() {
  const [activeStep, setActiveStep] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const stages = Array.from(document.querySelectorAll<HTMLElement>("[data-trackfy-stage]"));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveStep(Number((visible.target as HTMLElement).dataset.trackfyStage));
    }, { threshold: [0.35, 0.6, 0.85] });
    stages.forEach((stage) => observer.observe(stage));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const page = document.querySelector<HTMLElement>(".showcase-page");
    page?.classList.add("motion-ready");
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12%", threshold: 0.12 });
    revealTargets.forEach((target) => revealObserver.observe(target));

    const parallaxTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const updateScrollMotion = () => {
      frame = 0;
      setHeaderScrolled(window.scrollY > 10);
      parallaxTargets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const progress = (window.innerHeight * 0.5 - (rect.top + rect.height * 0.5)) / window.innerHeight;
        target.style.setProperty("--showcase-parallax", `${Math.max(-24, Math.min(24, progress * 34)).toFixed(1)}px`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrollMotion);
    };
    updateScrollMotion();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      revealObserver.disconnect();
      page?.classList.remove("motion-ready");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="showcase-page">
      <a className="showcase-skip" href="#conteudo">Pular para o conteúdo</a>
      <header className={`showcase-header ${headerScrolled ? "is-scrolled" : ""}`} aria-label="Navegação principal">
        <Link href="/landing" className="showcase-logo" aria-label="Trackfy, início"><Image src="/assets/logo-trackfy.svg" alt="Trackfy" width={117} height={35} priority /></Link>
        <nav className="showcase-menu" aria-label="Seções da página"><a href="#conteudo">Início</a><a href="#visao-geral">Recursos</a><a href="#descobrir">Descobrir</a><a href="#perguntas">FAQ</a></nav>
        <Link href="/criar-conta" className="showcase-header-cta">Começar agora <ChevronRight size={15} /></Link>
      </header>

      <section className="showcase-hero" id="conteudo">
        <div className="showcase-hero-art" data-parallax aria-hidden="true"><Image src={image("/uLT6N7xQJ2CqA4B9j57rE5M5Iif.jpg", "w1280")} alt="" fill priority sizes="100vw" /></div>
        <div className="showcase-hero-copy" data-reveal="hero"><p className="showcase-overline">Seu tracker de entretenimento</p><h1>Tudo o que você assiste.<br /><span>Em um só lugar.</span></h1><p>Acompanhe séries, filmes e animes, descubra o que vem a seguir e nunca mais perca seu progresso.</p><div className="showcase-actions"><Link href="/criar-conta" className="showcase-button">Começar agora <ChevronRight size={17} /></Link><a href="#visao-geral" className="showcase-text-link">Explorar o Trackfy <span aria-hidden="true">↓</span></a></div></div>
        <div className="showcase-hero-product" data-reveal="product"><AppWindow /></div>
      </section>

      <section className="showcase-statement" data-reveal><p>Séries. Filmes. Animes.<br /><span>Uma biblioteca só sua.</span></p><small>Descubra, salve e acompanhe tudo em um único lugar.</small></section>

      <section className="showcase-progress-section">
        <div className="showcase-section-copy" data-reveal><p className="showcase-overline">Progresso</p><h2>Continue exatamente<br />de onde parou.</h2><p>O Trackfy organiza episódios, temporadas e conteúdos em andamento para você sempre saber qual é o próximo.</p></div>
        <div className="showcase-progress-product" data-reveal="product"><div className="showcase-tv"><div className="showcase-tv-image" data-parallax><Image src={image("/uLT6N7xQJ2CqA4B9j57rE5M5Iif.jpg", "w1280")} alt="Cena de Severance" fill sizes="(max-width: 800px) 100vw, 58vw" /></div><div className="showcase-tv-shade" /><div className="showcase-tv-copy"><span>Severance</span><strong>Temporada 2 · Episódio 06</strong><p>6 de 10 episódios assistidos</p><div><i /><b>60%</b></div></div></div><div className="showcase-next-episode"><span>PRÓXIMO EPISÓDIO</span><strong>Atropos</strong><p>T2 E07 · 47 min</p><Check size={18} /></div></div>
      </section>

      <section className="showcase-scroll-story" aria-label="Como o Trackfy acompanha seu progresso">
        <div className="showcase-scroll-heading" data-reveal><p className="showcase-overline">Do seu jeito</p><h2>Um passo de cada vez.</h2><p>O que você assiste muda. Sua biblioteca acompanha.</p></div>
        <div className="showcase-scroll-stages">{steps.map(([title, description], index) => <article data-trackfy-stage={index} key={title} className={activeStep === index ? "is-active" : ""}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        <div className="showcase-scroll-demo" data-reveal="product"><div className="showcase-demo-phone"><div className="showcase-phone-top"><Image src="/assets/logo-mark.svg" alt="" width={18} height={18} /><span>Detalhes</span></div><div className="showcase-demo-poster"><Poster {...posters[activeStep + 1]} /></div><div className="showcase-demo-copy"><small>{activeStep === 0 ? "Adicionado à sua lista" : activeStep === 1 ? "Progresso atualizado" : "Pronto para continuar"}</small><strong>{posters[activeStep + 1].title}</strong><p>{activeStep === 0 ? "Minha lista" : activeStep === 1 ? "T2 E06 assistido" : "Próximo: T2 E07"}</p><button type="button">{activeStep === 0 ? <><Plus size={15} /> Na minha lista</> : <><Check size={15} /> {activeStep === 1 ? "Episódio assistido" : "Continuar acompanhando"}</>}</button></div></div></div>
      </section>

      <section className="showcase-overview" id="visao-geral"><div className="showcase-overview-heading" data-reveal><p className="showcase-overline">Uma visão mais próxima</p><h2>Tudo que importa.<br />De relance.</h2></div><div className="showcase-editorial-grid"><article className="showcase-grid-large" data-reveal><div><span>Em andamento</span><h3>Continue<br />assistindo.</h3><p>Seu progresso, sem procurar.</p></div><AppWindow compact /></article><article className="showcase-grid-calendar" data-reveal><span>Próximos episódios</span><h3>O que vem<br />a seguir.</h3><ul><li><b>Hoje</b><span>The Last of Us · T2 E05</span></li><li><b>Amanhã</b><span>Solo Leveling · T3 E02</span></li><li><b>Sexta</b><span>Severance · T2 E07</span></li></ul></article><article className="showcase-grid-posters" data-reveal><span>Tendências</span><h3>O que está<br />em alta.</h3><div>{posters.slice(0, 3).map((poster) => <div key={poster.title}><Poster {...poster} /></div>)}</div></article><article className="showcase-grid-library" data-reveal><span>Sua biblioteca</span><h3>Tudo em um só lugar.</h3><div className="showcase-library-tabs"><b>Todos</b><span>Séries</span><span>Filmes</span><span>Animes</span></div></article></div></section>

      <section className="showcase-discovery" id="descobrir"><div className="showcase-discovery-copy" data-reveal><p className="showcase-overline">Descoberta</p><h2>Quando acabar,<br />a gente encontra o próximo.</h2><p>Descubra séries, filmes e animes populares ou encontre algo novo baseado no que você já acompanha.</p><Link href="/populares" className="showcase-text-link">Explorar tendências <ChevronRight size={16} /></Link></div><div className="showcase-marquee" data-reveal aria-label="Pôsteres de conteúdos populares"><div>{[...posters, ...posters].map((poster, index) => <div className="showcase-marquee-poster" key={`${poster.title}-${index}`}><Poster {...poster} /></div>)}</div></div></section>

      <section className="showcase-library"><div data-reveal><p className="showcase-overline">Organização</p><h2>Sua biblioteca.<br />Do seu jeito.</h2><p>Filtre o que está assistindo, o que quer ver e tudo que já fez parte da sua história.</p></div><div className="showcase-library-window" data-reveal="product"><div className="showcase-library-nav"><strong>Minha lista</strong><span>Todos</span><span>Séries</span><span>Filmes</span><span>Animes</span></div><div>{posters.map((poster) => <div className="showcase-library-poster" key={poster.title}><Poster {...poster} /></div>)}</div></div></section>

      <section className="showcase-detail"><div className="showcase-detail-art" data-reveal="product"><Image src={image("/uLT6N7xQJ2CqA4B9j57rE5M5Iif.jpg", "w1280")} alt="Cena de Severance" fill sizes="(max-width: 800px) 100vw, 50vw" /><div><div className="showcase-detail-poster"><Poster {...posters[0]} /></div><span>Severance</span></div></div><div className="showcase-detail-copy" data-reveal><p className="showcase-overline">Detalhes</p><h2>Tudo antes<br />do próximo episódio.</h2><p>Sinopse, temporadas, status de acompanhamento e tudo que você precisa saber antes de continuar.</p><dl><div><dt>2</dt><dd>temporadas</dd></div><div><dt>9.1</dt><dd>sua avaliação</dd></div><div><dt>06</dt><dd>episódios vistos</dd></div></dl></div></section>

      <section className="showcase-devices"><div data-reveal><p className="showcase-overline">Sempre com você</p><h2>Onde você estiver.<br />Sua biblioteca também.</h2></div><div className="showcase-device-stage" data-reveal="product"><div className="showcase-laptop"><AppWindow compact /></div><div className="showcase-tablet"><AppWindow compact /></div><div className="showcase-mobile"><AppWindow compact /></div></div></section>

      <section className="showcase-dark-cta"><div className="showcase-dark-backdrop" data-parallax aria-hidden="true">{posters.slice(0, 5).map((poster) => <div key={poster.title}><Poster {...poster} /></div>)}</div><div data-reveal><p className="showcase-overline">Trackfy</p><h2>Menos tempo procurando.<br />Mais tempo acompanhando.</h2><p>Descubra o que vale a pena e guarde cada história no lugar certo.</p></div></section>

      <section className="showcase-faq" id="perguntas"><div data-reveal><p className="showcase-overline">Perguntas, respondidas.</p><h2>O que você quer saber?</h2></div><div data-reveal>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="showcase-final"><div data-reveal><p className="showcase-overline">Comece agora</p><h2>Seu próximo episódio<br />já está esperando.</h2><p>Crie sua biblioteca e comece a acompanhar tudo o que você assiste.</p><Link href="/criar-conta" className="showcase-button">Começar agora <ChevronRight size={17} /></Link></div><div className="showcase-final-product" data-parallax><AppWindow compact /></div></section>
      <footer className="showcase-footer"><Image src="/assets/logo-trackfy.svg" alt="Trackfy" width={104} height={31} /><nav aria-label="Links do rodapé"><a href="#visao-geral">Produto</a><a href="#perguntas">Privacidade</a><a href="#perguntas">Termos</a></nav><span>© {new Date().getFullYear()} Trackfy</span></footer>
    </main>
  );
}
