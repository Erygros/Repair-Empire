"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
const slides = [
  { src: "/images/repair-campus-art.webp", label: "Repair Empire" },
  { src: "/images/website-workshop.webp", label: "Werkstatt" },
  { src: "/images/website-repair.webp", label: "Reparatur" },
  { src: "/images/website-research.webp", label: "Forschung" },
  { src: "/images/website-expanded.webp", label: "Unternehmen" },
];
export function AuthSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
      if (!paused && !preference.matches) timer = setInterval(() => setActive(index => (index + 1) % slides.length), 6500);
    };
    update(); preference.addEventListener("change", update);
    return () => { clearInterval(timer); preference.removeEventListener("change", update); };
  }, [paused]);
  function move(offset: number) { setPaused(true); setActive(index => (index + offset + slides.length) % slides.length); }
  return <section className={`auth-slideshow ${paused ? "is-paused" : ""}`} aria-label="Repair Empire Bilder">
    {slides.map((slide, index) => <div className={`auth-slide ${active === index ? "is-active" : ""}`} aria-hidden={active !== index} key={slide.src}><Image unoptimized src={slide.src} alt={slide.label} fill sizes="(max-width: 900px) 100vw, 65vw" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"}/></div>)}
    <div className="auth-slide-shade"/>
    <div className="auth-slide-controls"><span>{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span><button type="button" onClick={() => move(-1)} aria-label="Vorheriges Bild" title="Vorheriges Bild"><ChevronLeft size={20}/></button><button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? "Diashow fortsetzen" : "Diashow pausieren"} title={paused ? "Diashow fortsetzen" : "Diashow pausieren"}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button><button type="button" onClick={() => move(1)} aria-label="Nächstes Bild" title="Nächstes Bild"><ChevronRight size={20}/></button></div>
  </section>;
}
