import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { NewsMeta, NewsVisual } from "@/components/news-visual";
import { getNews, PUBLISHED_NEWS } from "@/content/news";
import "../news.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const item = getNews((await params).slug);
  return item ? { title: item.title, description: item.excerpt } : { title: "Meldung nicht gefunden" };
}

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  const item = getNews((await params).slug);
  if (!item) notFound();
  const related = PUBLISHED_NEWS.filter(other => other.id !== item.id).slice(0, 2);
  return <PublicShell><main className="news-surface news-detail">
    <article>
      <header className="news-detail-heading news-width"><Link href="/news" className="news-back"><ArrowLeft size={16}/> Zurück zu News</Link><NewsMeta item={item}/><h1>{item.title}</h1><p className="news-detail-lead">{item.excerpt}</p></header>
      <div className="news-detail-art news-width"><NewsVisual item={item} eager sizes="(max-width: 1400px) 95vw, 1320px"/><span className="news-image-mark" aria-hidden="true">REPAIR EMPIRE / {item.category.toUpperCase()}</span></div>
      <div className="news-article-body">{item.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<Link href="/news" className="news-back"><ArrowLeft size={16}/> Alle Meldungen</Link></div>
    </article>
    {!!related.length && <section className="news-related news-width" aria-labelledby="related-heading"><p className="re-eyebrow">AUS DER WERKSTATT</p><h2 id="related-heading">Weitere Meldungen</h2><div className="news-cards">{related.map(other => <article className="news-card" key={other.id}><Link className="news-card-link" href={`/news/${other.slug}`}><div className="news-card-art"><NewsVisual item={other} sizes="(max-width: 640px) 100vw, (max-width: 1400px) 50vw, 650px"/></div><div className="news-card-copy"><NewsMeta item={other}/><h3>{other.title}</h3><p>{other.excerpt}</p><span className="news-read-link">Weiterlesen <ArrowUpRight size={18}/></span></div></Link></article>)}</div></section>}
  </main></PublicShell>;
}
