import { Check, Cpu, X } from "lucide-react";
import { getAssignedEmployee, getJobEconomy, getWorkstationEligibility } from "@/game/logic/game";
import type { GameState, RepairOrder } from "@/game/types";
import { formatMoney } from "@/utils/format";

export function AssignmentDock({ order, state, onAssign, onClose }: { order: RepairOrder; state: GameState; onAssign: (workstationId: string) => void; onClose: () => void }) {
  const economy = getJobEconomy(order, state.upgrades);
  return (
    <div className="dock-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="assignment-dock" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
        <header><div><p className="panel-label">AUFTRAG ZUWEISEN // {order.id}</p><h3 id="assignment-title">{order.device} · {order.issue}</h3></div><button onClick={onClose} aria-label="Zuweisung schließen"><X size={19} /></button></header>
        <div className="assignment-summary"><span>Skill {order.skillRequirement}</span><span>{order.category}</span><span>Material -{formatMoney(order.materialCost)}</span><span>Umsatz {formatMoney(order.reward)}</span><strong>Gewinn {formatMoney(economy.estimatedProfit)}</strong></div>
        <div className="assignment-options">
          {state.workstations.map((workstation) => {
            const eligibility = getWorkstationEligibility(state, workstation, order);
            const employee = getAssignedEmployee(state, workstation);
            return (
              <button key={workstation.id} disabled={!eligibility.eligible} onClick={() => onAssign(workstation.id)}>
                <span className="assignment-icon">{eligibility.eligible ? <Check size={18} /> : <Cpu size={18} />}</span>
                <span><strong>Arbeitsplatz {workstation.index}</strong><small>{workstation.index === 1 ? "Spieler" : employee ? `${employee.name} · Skill ${employee.skill}` : eligibility.reason}</small></span>
                <em>{eligibility.eligible ? "Zuweisen" : eligibility.reason}</em>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

