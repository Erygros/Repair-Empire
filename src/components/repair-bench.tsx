import { Check, CircuitBoard, Clock3, Cpu, Gauge, Wrench } from "lucide-react";
import type { ActiveRepair } from "@/game/types";
import { formatClock, formatMoney } from "@/utils/format";

interface RepairBenchProps {
  activeRepair: ActiveRepair | null;
  now: number;
  progress: number;
  onComplete: () => void;
}

export function RepairBench({ activeRepair, now, progress, onComplete }: RepairBenchProps) {
  const isReady = progress >= 100;
  const remaining = activeRepair ? activeRepair.endsAt - now : 0;

  return (
    <section className="panel bench-panel">
      <div className="panel-header">
        <div>
          <p className="panel-label">ARBEITSPLATZ 01</p>
          <h3>{activeRepair ? "Reparaturdiagnose" : "Werkbank bereit"}</h3>
        </div>
        <span className={`state-chip ${activeRepair ? (isReady ? "ready" : "busy") : "idle"}`}>
          {activeRepair ? (isReady ? "Abnahme" : "Belegt") : "Frei"}
        </span>
      </div>

      <div className={`scanner ${activeRepair ? "is-active" : ""}`}>
        <div className="scanner-corners" aria-hidden="true" />
        <div className="scope" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
          <div className="scope-inner">
            {activeRepair ? <Cpu size={38} strokeWidth={1.4} /> : <Wrench size={34} strokeWidth={1.4} />}
            <strong>{activeRepair ? `${Math.floor(progress)}%` : "01"}</strong>
            <span>{activeRepair ? (isReady ? "FERTIG" : "PROZESS") : "BEREIT"}</span>
          </div>
        </div>
        <div className="signal-line" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      </div>

      {activeRepair ? (
        <div className="active-job">
          <div className="job-title-row">
            <div>
              <span className="order-id">{activeRepair.order.id}</span>
              <h4>{activeRepair.order.device}</h4>
              <p>{activeRepair.order.issue}</p>
            </div>
            <div className="reward-readout">
              <span>Auszahlung</span>
              <strong>{formatMoney(activeRepair.order.reward)}</strong>
            </div>
          </div>

          <div className="diagnostic-row">
            <span><CircuitBoard size={15} /> {activeRepair.order.diagnostic}</span>
            <span><Clock3 size={15} /> {isReady ? "00:00" : formatClock(remaining)}</span>
          </div>

          <div className="progress-track" aria-label={`Reparaturfortschritt ${Math.floor(progress)} Prozent`}>
            <span style={{ width: `${progress}%` }} />
          </div>

          <button className="complete-button" disabled={!isReady} onClick={onComplete}>
            {isReady ? <Check size={18} /> : <Gauge size={18} />}
            {isReady ? "Reparatur abnehmen" : "Reparatur läuft"}
          </button>
        </div>
      ) : (
        <div className="empty-bench">
          <CircuitBoard size={20} />
          <div>
            <strong>Kein Gerät eingespannt</strong>
            <p>Wähle einen Auftrag aus der Auftragsbörse.</p>
          </div>
        </div>
      )}
    </section>
  );
}

