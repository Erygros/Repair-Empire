"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Newspaper } from "lucide-react";
import type { NewsItem } from "@/content/news";
import { NewsMeta, NewsVisual } from "@/components/news-visual";

export function NewsBrowser({ items }: { items: NewsItem[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const categories = Array.from(new Set(items.map(item => item.category)));
  const visible = category ? items.filter(item => item.category === category) : items;
  return <section className="news-feed news-width" aria-labelledby="news-feed-heading">
    <header className="news-feed-heading"><div><p className="re-eyebrow">AUS DER WERKSTATT</p><h2 id="news-feed-heading">Alle Meldungen</h2></div><span className="news-result-count" role="status">{visible.length} {visible.length === 1 ? "Meldung" : "Meldungen"}</span></header>
    <div className="news-filters" role="group" aria-label="News nach Kategorie filtern">
      {[null, ...categories].map(value => <button type="button" key={value ?? "all"} aria-pressed={category === value} aria-controls="news-results" onClick={() => setCategory(value)}>{value ?? "Alle"}</button>)}
    </div>
    <div id="news-results" className="news-cards">{visible.map(item => <article className="news-card" key={item.id}>
      <Link href={`/news/${item.slug}`} className="news-card-link">
        <div className="news-card-art"><NewsVisual item={item}/><span className="news-image-mark" aria-hidden="true">{item.category === "Milestone" ? "FOUNDATION / REPAIR EMPIRE" : "REPAIR EMPIRE"}</span></div>
        <div className="news-card-copy"><NewsMeta item={item}/><h3>{item.title}</h3><p>{item.excerpt}</p><span className="news-read-link">Weiterlesen <ArrowUpRight size={18}/></span></div>
      </Link>
    </article>)}</div>
    {!visible.length && <div className="news-empty"><Newspaper size={30}/><h3>Derzeit keine neuen Werkstatt-Meldungen.</h3><p>Neue Meldungen erscheinen hier, sobald sie veröffentlicht sind.</p></div>}
  </section>;
}
