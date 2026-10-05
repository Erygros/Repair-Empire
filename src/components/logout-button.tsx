"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
export function LogoutButton({ label = "Logout", icon = false, beforeLogout }: { label?: string; icon?: boolean; beforeLogout?: () => boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      if (beforeLogout && !beforeLogout()) { setBusy(false); return; }
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch { setError("Logout fehlgeschlagen. Bitte versuche es erneut."); setBusy(false); }
  }
  return <><button disabled={busy} onClick={logout}>{icon && <LogOut size={24}/>}<span>{busy ? "Bitte warten" : label}</span></button>{error && <p className="auth-error" role="alert">{error}</p>}</>;
}
