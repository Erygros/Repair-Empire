import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireSession } from "@/lib/session";
import { PublicShell } from "@/components/public-shell";
import { LogoutButton } from "@/components/logout-button";
import { FounderIcon, ReadyIcon, LockedIcon } from "@/components/repair-icons";
import "../news/news.css";
import "./account.css";

export const metadata = { title: "Account | Repair Empire", robots: { index: false, follow: false } };
export default async function Account() {
  const { user } = await requireSession();
  return <PublicShell><main className="news-surface account-page">
    <section className="news-hero"><Image src="/images/repair-campus-art.webp" alt="" fill loading="eager" fetchPriority="high" sizes="100vw"/><div className="news-hero-shade"/><div className="news-width news-hero-copy"><p className="re-eyebrow">REPAIR EMPIRE / DEIN ACCOUNT</p><h1>ACCOUNT<span>.</span></h1><p>Willkommen, {user.username ?? user.name}.</p></div></section>
    <section className="news-width account-overview" aria-labelledby="account-heading">
      <header className="account-heading"><div><p className="re-eyebrow">DEIN PROFIL</p><h2 id="account-heading">Accountdaten</h2></div><span className="account-character-status">{user.characterCreated ? <ReadyIcon size="sm"/> : <LockedIcon size="sm"/>}{user.characterCreated ? "Character erstellt" : "Character ausstehend"}</span></header>
      <dl className="account-details"><div><dt>Username</dt><dd>{user.username ?? user.name}</dd></div><div><dt>CEO-Name</dt><dd>{user.ceoName ?? user.name}</dd></div><div><dt>E-Mail</dt><dd>{user.email}</dd></div><div><dt>Account erstellt</dt><dd>{new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin" }).format(new Date(user.createdAt))}</dd></div></dl>
      <div className="account-actions"><Link className="re-button" href={user.characterCreated ? "/play" : "/create-character"}><FounderIcon size="sm"/>{user.characterCreated ? "Weiterspielen" : "Character erstellen"}<ArrowUpRight size={18}/></Link><LogoutButton label="Abmelden" icon/></div>
    </section>
  </main></PublicShell>;
}
