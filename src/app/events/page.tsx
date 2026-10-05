import Image from "next/image";
import { PublicShell } from "@/components/public-shell";
import { EventsNavIcon, SeasonsIcon, ReadyIcon, PausedIcon } from "@/components/repair-icons";
import "../news/news.css";
import "./events.css";
export const metadata = { title: "Events & Seasons", description: "Offizieller Event- und Season-Status von Repair Empire." };
export default function Events() {
  return <PublicShell><main className="news-surface events-page">
    <section className="news-hero"><Image src="/images/repair-campus-art.webp" alt="" fill loading="eager" fetchPriority="high" sizes="100vw"/><div className="news-hero-shade"/><div className="news-width news-hero-copy"><p className="re-eyebrow">REPAIR EMPIRE / LIVE OPERATIONS</p><h1>EVENTS &amp;<br/>SEASONS<span>.</span></h1><p>Aktionen, Herausforderungen und Seasons aus Repair Empire.</p></div></section>
    <section className="news-feature news-width" aria-labelledby="season-heading"><div className="news-feature-label"><span>SEASON-STATUS</span><span>REPAIR EMPIRE</span></div><div className="events-season"><SeasonsIcon size="xl"/><div><p className="news-meta">IN ENTWICKLUNG</p><h2 id="season-heading">Derzeit keine Season aktiv.</h2><p>Neue Seasons werden hier angekündigt, sobald Termine und Inhalte feststehen.</p></div></div></section>
    <section className="news-feed news-width" aria-labelledby="events-heading"><header className="news-feed-heading"><div><p className="re-eyebrow">EVENT-ÜBERSICHT</p><h2 id="events-heading">Alle Events</h2></div><span className="news-result-count">0 Events</span></header><div className="events-status-list">{[
      { title: "Aktiv", text: "Keine aktiven Events", Icon: EventsNavIcon },
      { title: "Kommend", text: "Noch keine Events angekündigt", Icon: ReadyIcon },
      { title: "Beendet", text: "Keine vergangenen Events", Icon: PausedIcon },
    ].map(({ title, text, Icon }) => <article key={title}><Icon size="lg"/><div><p className="news-meta">{title}</p><h3>{text}</h3></div></article>)}</div></section>
  </main></PublicShell>;
}
