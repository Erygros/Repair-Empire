"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch { setError("Logout fehlgeschlagen. Bitte versuche es erneut."); setBusy(false); }
  }
  return <><button disabled={busy} onClick={logout}>{busy ? "Bitte warten" : "Logout"}</button>{error && <p className="auth-error" role="alert">{error}</p>}</>;
}
