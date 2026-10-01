import { Clock3, Coins, X } from "lucide-react";
import type { OfflineSummary } from "@/game/types";
import { formatMoney } from "@/utils/format";

function formatAbsence(milliseconds: number) {
  const minutes = Math.max(1, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function OfflineReport({ summary, onClose }: { summary: OfflineSummary; onClose: () => void }) {
  return (
    <div className="dock-backdrop">
      <section className="offline-report" role="dialog" aria-modal="true" aria-labelledby="offline-title">
        <button className="offline-close" onClick={onClose} aria-label="Zusammenfassung schließen"><X size={18} /></button>
        <Clock3 size={28} />
        <p className="panel-label">BETRIEBSPROTOKOLL</p>
        <h3 id="offline-title">Willkommen zurück</h3>
        <p>Dein automatisiertes Team hat bereits gestartete Arbeiten zuverlässig abgeschlossen.</p>
        <div className="offline-stats"><span>Abwesend<strong>{formatAbsence(summary.durationMs)}</strong></span><span>Abgeschlossen<strong>{summary.completedRepairs}</strong></span><span>Verdient<strong>{formatMoney(summary.earnings)}</strong></span><span>Reputation<strong>+{summary.reputation}</strong></span><span>Team-XP<strong>+{summary.employeeXp}</strong></span></div>
        <button className="offline-confirm" onClick={onClose}><Coins size={17} /> Ertrag verbuchen</button>
      </section>
    </div>
  );
}

