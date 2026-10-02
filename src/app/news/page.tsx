import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { NewsBrowser } from "@/components/news-browser";
import { NewsMeta, NewsVisual } from "@/components/news-visual";
import { PUBLISHED_NEWS } from "@/content/news";
import "./news.css";
export const metadata={title:"News",description:"Entwicklungsnews zu Repair Empire."};
export default function NewsPage() {
  const featured = PUBLISHED_NEWS.find(item => item.featured) ?? PUBLISHED_NEWS[0];
  return <PublicShell><main className="news-surface news-page">
    <section className="news-hero">
      <Image src="/images/repair-campus-art.webp" alt="" fill loading="eager" fetchPriority="high" sizes="100vw"/>
      <div className="news-hero-shade"/>
      <div className="news-width news-hero-copy"><p className="re-eyebrow">WERKSTATT-FUNK</p><h1>NEWS<span>.</span></h1><p>Updates, Entwicklungsstände und Neuigkeiten<br className="news-desktop-break"/> aus Repair Empire.</p></div>
    </section>
    {featured && <section className="news-feature news-width" aria-labelledby="news-feature-heading" data-reveal>
      <div className="news-feature-label"><span>IM FOKUS</span><span>REPAIR EMPIRE / NEWS</span></div>
      <article><Link href={`/news/${featured.slug}`} className="news-feature-link">
        <div className="news-feature-art"><NewsVisual item={featured} sizes="(max-width: 760px) 100vw, 750px"/><span className="news-image-mark" aria-hidden="true">REPAIR EMPIRE / {featured.category.toUpperCase()}</span></div>
        <div className="news-feature-copy"><NewsMeta item={featured}/><h2 id="news-feature-heading">{featured.title}</h2><p>{featured.excerpt}</p><span className="news-read-link">Meldung lesen <ArrowUpRight size={20}/></span></div>
      </Link></article>
    </section>}
    <NewsBrowser items={PUBLISHED_NEWS}/>
  </main></PublicShell>;
}
