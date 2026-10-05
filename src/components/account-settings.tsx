"use client";
import { useState, type FormEvent } from "react";
import { Save, Mail, KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import "./account-settings.css";
export function AccountSettings() {
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ form: string; error: boolean; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>, form: "email" | "password") {
    event.preventDefault();
    const element = event.currentTarget, fields = new FormData(element);
    setBusy(form); setFeedback(null);
    try {
      const currentPassword = String(fields.get("currentPassword"));
      if (form === "email") {
        const response = await fetch("/api/account/email", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: fields.get("email"), currentPassword }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? "E-Mail konnte nicht geändert werden.");
        await authClient.getSession({ query: { disableCookieCache: true } });
      } else {
        const newPassword = String(fields.get("newPassword"));
        if (newPassword !== fields.get("confirmation")) throw new Error("Die neuen Passwörter stimmen nicht überein.");
        const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
        if (result.error) throw new Error("Passwort konnte nicht geändert werden. Prüfe dein aktuelles Passwort oder melde dich erneut an.");
      }
      element.reset();
      setFeedback({ form, error: false, text: form === "email" ? "E-Mail geändert." : "Passwort geändert. Andere Sitzungen wurden abgemeldet." });
    } catch (error) { setFeedback({ form, error: true, text: error instanceof Error ? error.message : "Änderung fehlgeschlagen. Bitte erneut versuchen." }); }
    finally { setBusy(null); }
  }
  return <section className="account-settings" aria-labelledby="account-settings-title"><header><p className="panel-label">DEIN ACCOUNT</p><h2 id="account-settings-title">Einstellungen</h2></header>
    {isPending ? <p role="status">Account wird geladen …</p> : !session ? <p role="alert">Bitte erneut anmelden.</p> : <div className="account-settings-forms">
      <form onSubmit={event => submit(event, "email")}><h3><Mail size={20}/>E-Mail</h3><p className="account-current-email">Aktuell: {session.user.email}</p><label>Neue E-Mail<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Aktuelles Passwort<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/></label><button disabled={busy !== null} type="submit"><Save size={18}/>{busy === "email" ? "Wird gespeichert …" : "E-Mail speichern"}</button>{feedback?.form === "email" && <p role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}</form>
      <form onSubmit={event => submit(event, "password")}><h3><KeyRound size={20}/>Passwort</h3><label>Aktuelles Passwort<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/></label><label>Neues Passwort<input name="newPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128}/></label><label>Neues Passwort bestätigen<input name="confirmation" type="password" autoComplete="new-password" required minLength={10} maxLength={128}/></label><button disabled={busy !== null} type="submit"><Save size={18}/>{busy === "password" ? "Wird gespeichert …" : "Passwort speichern"}</button>{feedback?.form === "password" && <p role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}</form>
    </div>}</section>;
}
