import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/repair-icons";
import { AuthForm } from "@/components/auth-form";
import { AuthSlideshow } from "@/components/auth-slideshow";
import "./auth-layout.css";

export function AuthLayout({ mode }: { mode: "login" | "register" }) {
  return <main className={`auth-standalone auth-${mode}`}>
    <section className="auth-access" aria-label={mode === "login" ? "Anmelden" : "Registrieren"}>
      <header className="auth-brand"><Link href="/" aria-label="Repair Empire Startseite"><BrandLogo variant="full"/></Link><Link className="auth-home" href="/" title="Zur Startseite" aria-label="Zur Startseite"><ArrowLeft size={20}/></Link></header>
      <div className="auth-form-area"><AuthForm mode={mode}/></div>
      <nav className="auth-mode-links" aria-label="Account-Zugang"><Link href="/login" aria-current={mode === "login" ? "page" : undefined}>Einloggen</Link><Link href="/register" aria-current={mode === "register" ? "page" : undefined}>Registrieren</Link></nav>
    </section>
    <div className="auth-divider" aria-hidden="true"/>
    <AuthSlideshow/>
  </main>;
}
