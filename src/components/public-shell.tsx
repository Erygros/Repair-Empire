import Link from "next/link";
import type { ReactNode } from "react";
import { Menu, Wrench } from "lucide-react";
import { WebsiteAccess, WebsiteMobileAccount, WebsiteNav } from "@/components/website-access";
import { WebsiteMotion } from "@/components/website-motion";
import "@/app/website.css";

export function PublicShell({ children }: { children: ReactNode }) {
  return <div className="public-site website-v2"><WebsiteMotion/><header className="public-header"><Link href="/" className="public-brand"><span><Wrench size={23}/></span><strong>REPAIR <b>EMPIRE</b></strong></Link><WebsiteNav/><WebsiteAccess navigation/><details className="website-mobile-menu"><summary aria-label="Navigation öffnen"><Menu size={22}/></summary><nav aria-label="Mobile Navigation"><Link href="/#game">Spiel</Link><Link href="/news">News</Link><Link href="/events">Events & Seasons</Link><WebsiteMobileAccount/></nav></details></header>{children}<footer><div><strong>REPAIR EMPIRE</strong><p>Jedes Empire beginnt an einer Werkbank.</p></div><nav aria-label="Footernavigation"><Link href="/news">News</Link><Link href="/events">Events</Link><Link href="/login">Login</Link><Link href="/register">Registrieren</Link><span>Impressum</span><span>Datenschutz</span></nav></footer></div>;
}
