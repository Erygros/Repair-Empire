import { AlertTriangle, Clock3, Coins, TrendingUp, X } from "lucide-react";
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
        <p>Dein automatisiertes Team hat während deiner Abwesenheit weitergearbeitet.</p>
        {summary.capacityReached && <div className="offline-cap"><AlertTriangle size={16} /><span><strong>Offline-Kapazität erreicht</strong> Produktive Zeit ist auf 8 Stunden begrenzt.</span></div>}
        <div className="offline-time"><span>Offline-Zeit<strong>{formatAbsence(summary.durationMs)}</strong></span><span>Produktive Zeit<strong>{formatAbsence(summary.productiveDurationMs)}</strong></span><span>Reparaturen<strong>{summary.completedRepairs}</strong></span></div>
        <div className="offline-balance">
          <span>Umsatz<strong>{formatMoney(summary.revenue)}</strong></span>
          <span>Materialkosten<strong>-{formatMoney(summary.materialCosts)}</strong></span>
          <span>Betriebskosten<strong>-{formatMoney(summary.operatingCosts)}</strong></span>
          <span className="offline-profit"><TrendingUp size={15} /> Gewinn<strong>{formatMoney(summary.profit)}</strong></span>
        </div>
        <div className="offline-progress"><span>Reputation <strong>+{summary.reputation}</strong></span><span>Mitarbeiter-XP <strong>+{summary.employeeXp}</strong></span>{summary.levelUps.length > 0 && <span>Level-Ups <strong>{summary.levelUps.join(", ")}</strong></span>}</div>
        <button className="offline-confirm" onClick={onClose}><Coins size={17} /> Bericht schließen</button>
      </section>
    </div>
  );
}

