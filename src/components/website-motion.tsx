"use client";

import { useEffect } from "react";

export function WebsiteMotion() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sections = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("revealed"); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    if (!reduced.matches) sections.forEach(section => { section.classList.add("reveal-ready"); observer.observe(section); });
    const header = document.querySelector(".public-header");
    const scroll = () => header?.classList.toggle("scrolled", window.scrollY > 30);
    scroll(); window.addEventListener("scroll", scroll, { passive: true });
    const hero = document.querySelector<HTMLElement>(".re-hero");
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced.matches) return;
      hero?.style.setProperty("--look-x", `${(event.clientX / innerWidth - .5) * 12}px`);
      hero?.style.setProperty("--look-y", `${(event.clientY / innerHeight - .5) * 8}px`);
    };
    const reset = () => { hero?.style.setProperty("--look-x", "0px"); hero?.style.setProperty("--look-y", "0px"); };
    const motionChange = () => { if (reduced.matches) { sections.forEach(section => section.classList.add("revealed")); reset(); } };
    hero?.addEventListener("pointermove", move); hero?.addEventListener("pointerleave", reset); reduced.addEventListener("change", motionChange);
    return () => { observer.disconnect(); window.removeEventListener("scroll", scroll); hero?.removeEventListener("pointermove", move); hero?.removeEventListener("pointerleave", reset); reduced.removeEventListener("change", motionChange); };
  }, []);
  return null;
}
