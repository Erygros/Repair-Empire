export const WORKSHOP_STEPS = ["Diagnose", "Reparatur", "Funktionstest", "Endkontrolle"] as const;
export const WORKSHOP_STEP_X = [-4.5, -1.5, 1.5, 4.5] as const;
export function getWorkshopStep(progress: number) {
  const safe = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  return safe >= 100 ? null : Math.min(3, Math.floor(safe / 25));
}
export function getWorkshopIdleSpeech(seconds: number, completed: boolean) {
  if (!Number.isFinite(seconds) || seconds < 12 || (seconds - 12) % 28 >= 5) return null;
  if (completed) return "Fertig! Das Gerät ist bereit zur Abnahme.";
  const lines = ["Mir ist langweilig. Zeit für einen neuen Auftrag!", "Die Werkzeuge sind bereit. Was reparieren wir?", "Alles aufgeräumt. Jetzt fehlt nur noch Arbeit.", "Ob der nächste Auftrag ein Laptop ist?"];
  return lines[Math.floor((seconds - 12) / 28) % lines.length];
}
