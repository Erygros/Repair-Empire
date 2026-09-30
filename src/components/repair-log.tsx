import { CheckCircle2, History, ShieldPlus } from "lucide-react";
import type { CompletedRepair } from "@/game/types";
import { formatMoney, formatTime } from "@/utils/format";

export function RepairLog({ repairs }: { repairs: CompletedRepair[] }) {
  return (
    <section className="panel log-panel">
      <div className="panel-header">
        <div>
          <p className="panel-label">WERKSTATTPROTOKOLL</p>
          <h3>Abgeschlossen</h3>
        </div>
        <History size={18} />
      </div>

      {repairs.length === 0 ? (
        <div className="empty-log">
          <CheckCircle2 size={25} />
          <strong>Noch keine Abnahme</strong>
          <p>Fertige Reparaturen erscheinen hier.</p>
        </div>
      ) : (
        <div className="log-list">
          {repairs.slice(0, 6).map((repair) => (
            <article className="log-entry" key={`${repair.id}-${repair.completedAt}`}>
              <CheckCircle2 size={18} />
              <div>
                <strong>{repair.device}</strong>
                <span>{repair.issue} · {formatTime(repair.completedAt)}</span>
              </div>
              <div className="log-value">
                <strong>+{formatMoney(repair.reward)}</strong>
                <span><ShieldPlus size={12} /> +{repair.reputationReward}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

