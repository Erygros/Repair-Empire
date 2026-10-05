"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DeviceIcon, NewsNavIcon, EventsNavIcon } from "@/components/repair-icons";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function WebsiteAccess({ navigation = false }: { navigation?: boolean }) {
  const { data: session } = authClient.useSession();
  return navigation ? <div className="website-access"><Link href={session ? "/account" : "/login"}>{session ? "Account" : "Einloggen"}</Link><Link className="re-button" href={session ? "/play" : "/register"}>{session ? "Weiterspielen" : "Registrieren"}<ArrowUpRight size={17}/></Link></div> : <div className="re-actions"><Link className="re-button" href={session ? "/play" : "/register"}>{session ? "Weiterspielen" : "Jetzt spielen"}<ArrowUpRight size={20}/></Link>{!session && <Link className="re-secondary" href="/login">Einloggen</Link>}</div>;
}

export function WebsiteNav() {
  const path = usePathname();
  return <nav aria-label="Hauptnavigation">{[["/#game","Spiel"],["/news","News"],["/events","Events & Seasons"]].map(([href,label]) => <Link key={href} href={href} aria-current={(href==="/#game"?path==="/":path.startsWith(href)) ? "page" : undefined}>{href==="/news"?<NewsNavIcon size="sm"/>:href==="/events"?<EventsNavIcon size="sm"/>:<DeviceIcon kind="Controller" size="sm"/>}{label}</Link>)}</nav>;
}

export function WebsiteMobileAccount() {
  const { data: session } = authClient.useSession();
  return session ? <><Link href="/play">Weiterspielen</Link><Link href="/account">Account</Link></> : <><Link href="/login">Einloggen</Link><Link href="/register">Registrieren</Link></>;
}
