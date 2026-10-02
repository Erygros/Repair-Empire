"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrationSchema } from "@/lib/account-validation";

const messages: Record<string, string> = {
  USERNAME_IS_ALREADY_TAKEN: "Username bereits vergeben.",
  USER_ALREADY_EXISTS: "E-Mail bereits registriert.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "E-Mail bereits registriert.",
  FAILED_TO_CREATE_USER: "Username oder E-Mail bereits vergeben.",
  INVALID_USERNAME_OR_PASSWORD: "Username oder Passwort ist ungültig.",
  INVALID_EMAIL_OR_PASSWORD: "Username oder Passwort ist ungültig.",
  INVALID_USERNAME: "Ungültiger Username.",
  INVALID_ORIGIN: "Die Website-Adresse stimmt nicht mit der Account-Konfiguration überein.",
};
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = Object.fromEntries(form);
      let body: Record<string, unknown> = { username: String(data.username ?? "").trim(), password: data.password };
      if (mode === "register") {
        const parsed = registrationSchema.safeParse({ ...data, terms: data.terms === "on" });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
        body = { ...parsed.data, name: parsed.data.ceoName };
      }
      const response = await fetch(mode === "register" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/username", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        if (response.status === 503) throw new Error(result.code === "ACCOUNT_SERVICE_NOT_CONFIGURED" ? "Account-Service ist noch nicht konfiguriert." : "Account-Service derzeit nicht verfügbar.");
        if (response.status === 429) throw new Error("Zu viele Versuche. Bitte warte kurz und versuche es erneut.");
        throw new Error(messages[result.code] ?? (result.code === "INVALID_REGISTRATION" ? result.message : mode === "login" ? "Username oder Passwort ist ungültig." : "Registrierung nicht möglich. Bitte prüfe deine Eingaben."));
      }
      const status = await fetch("/api/account/status", { cache: "no-store" });
      if (!status.ok) throw new Error("Account-Status konnte nicht geladen werden. Bitte versuche den Login erneut.");
      const account = await status.json();
      router.replace(account.characterCreated ? "/play" : "/create-character");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Vorgang fehlgeschlagen.");
      setBusy(false);
    }
  }
return <form className="auth-form" onSubmit={submit}><p className="panel-label">SECURE ACCESS</p><h1>{mode==="login"?"Einloggen":"Firma gründen"}</h1>{mode==="register"&&<><label>Username<input name="username" required autoComplete="username"/></label><label>CEO-Name<input name="ceoName" required maxLength={24}/></label><label>E-Mail<input name="email" required type="email" autoComplete="email"/></label><label>E-Mail wiederholen<input name="emailConfirm" required type="email"/></label></>}{mode==="login"&&<label>Username<input name="username" required autoComplete="username"/></label>}<label>Passwort<input name="password" required type="password" minLength={10} autoComplete={mode==="login"?"current-password":"new-password"}/></label>{mode==="register"&&<><label>Passwort wiederholen<input name="passwordConfirm" required type="password" minLength={10}/></label><label className="terms"><input name="terms" type="checkbox"/> Ich akzeptiere Datenschutz und Nutzungsbedingungen.</label></>}{error&&<p className="auth-error" role="alert">{error}</p>}<button disabled={busy}>{busy?"Bitte warten":mode==="login"?"Einloggen":"Account erstellen"}</button><p>{mode==="login"?<>Noch kein Account? <Link href="/register">Registrieren</Link></>:<>Bereits registriert? <Link href="/login">Einloggen</Link></>}</p></form>}
