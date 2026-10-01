import { Bot, Check, Clock3, LockKeyhole, Power, UserRound, Wrench } from "lucide-react";
import { getRepairOperatingCost, getRepairProgress } from "@/game/logic/game";
import type { AutomationPriority, Employee, GameState, Workstation } from "@/game/types";
import { formatClock, formatMoney } from "@/utils/format";

const PRIORITIES: { value: AutomationPriority; label: string }[] = [
  { value: "highest-profit", label: "Highest Profit" },
  { value: "fastest-jobs", label: "Fastest Jobs" },
  { value: "reputation", label: "Reputation" },
  { value: "specialization", label: "Specialization" },
];

interface WorkstationDeckProps {
  state: GameState;
  now: number;
  onPurchase: (workstationId: string) => void;
  onComplete: (workstationId: string) => void;
  onAssignEmployee: (workstationId: string, employeeId: string | null) => void;
  onToggleAutomation: (workstationId: string) => void;
  onSetPriority: (workstationId: string, priority: AutomationPriority) => void;
}

function StationCard({ workstation, state, now, onPurchase, onComplete, onAssignEmployee, onToggleAutomation, onSetPriority }: { workstation: Workstation } & WorkstationDeckProps) {
  const employee = workstation.assignedEmployeeId
    ? state.employees.find((item) => item.id === workstation.assignedEmployeeId) ?? null
    : null;
  const active = workstation.activeRepair;
  const progress = getRepairProgress(active, now);
  const completed = workstation.status === "completed" || progress >= 100;
  const remaining = active ? active.endsAt - now : 0;
  const projectedProfit = active ? active.order.reward - active.chargedMaterialCost - getRepairOperatingCost(state, active, workstation) : 0;

  if (workstation.status === "locked") {
    const affordable = state.money >= workstation.purchasePrice;
    const reputationReady = state.reputation >= workstation.requiredReputation;
    const levelReady = state.companyLevel >= workstation.requiredLevel;
    const previousWorkstation = state.workstations.find((item) => item.index === workstation.index - 1);
    const previousUnlocked = !previousWorkstation || previousWorkstation.status !== "locked";
    return (
      <article className="station-card locked-station">
        <div className="station-number">0{workstation.index}</div>
        <LockKeyhole size={27} />
        <h4>Arbeitsplatz {workstation.index}</h4>
        <p>Zusätzliche Kapazität für einen eigenständigen Techniker.</p>
        <div className="station-requirements"><span>Level {workstation.requiredLevel} · Rep. {workstation.requiredReputation}</span><strong>{formatMoney(workstation.purchasePrice)}</strong></div>
        <button disabled={!previousUnlocked || !affordable || !reputationReady || !levelReady} onClick={() => onPurchase(workstation.id)}>
          {!previousUnlocked
            ? `Arbeitsplatz ${workstation.index - 1} zuerst`
            : !levelReady
              ? `Level ${workstation.requiredLevel} benötigt`
            : !reputationReady
              ? `Reputation ${workstation.requiredReputation}`
              : affordable
                ? "Arbeitsplatz kaufen"
                : `${formatMoney(workstation.purchasePrice - state.money)} fehlen`}
        </button>
      </article>
    );
  }

  return (
    <article className={`station-card station-${workstation.status}`}>
      <header>
        <div><span className="station-code">STATION 0{workstation.index}</span><h4>Arbeitsplatz {workstation.index}</h4></div>
        <span className={`station-state ${workstation.status}`}>{completed ? "Fertig" : active ? "Reparatur" : "Bereit"}</span>
      </header>

      <div className="station-operator">
        <UserRound size={17} />
        {workstation.index === 1 ? (
          <div><strong>Spieler</strong><span>Manueller Arbeitsplatz</span></div>
        ) : (
          <select value={employee?.id ?? ""} disabled={Boolean(active)} onChange={(event) => onAssignEmployee(workstation.id, event.target.value || null)} aria-label={`Mitarbeiter für Arbeitsplatz ${workstation.index}`}>
            <option value="">Nicht besetzt</option>
            {state.employees.map((item: Employee) => (
              <option key={item.id} value={item.id}>{item.name} · Skill {item.skill}</option>
            ))}
          </select>
        )}
      </div>

      {active ? (
        <div className="station-job">
          <div className="station-device"><Wrench size={17} /><div><strong>{active.order.device}</strong><span>{active.order.issue}</span></div></div>
          <div className="station-job-meta"><span><Clock3 size={13} /> {completed ? "00:00" : formatClock(remaining)}</span><strong>Gewinn {formatMoney(projectedProfit)}</strong></div>
          <div className="station-progress"><span style={{ width: `${progress}%` }} /></div>
          <div className="station-modifiers"><span>{active.speedMultiplier.toFixed(2)}x Speed</span><span>Qualität {active.qualityRating}</span>{active.specializationBonus && <span className="bonus">Spezialbonus</span>}</div>
          {!workstation.automationEnabled && (
            <button className="station-complete" disabled={!completed} onClick={() => onComplete(workstation.id)}>
              {completed ? <Check size={16} /> : <Clock3 size={16} />}{completed ? "Reparatur abnehmen" : "Reparatur läuft"}
            </button>
          )}
        </div>
      ) : (
        <div className="station-empty"><Power size={23} /><strong>{employee || workstation.index === 1 ? "Bereit für einen Auftrag" : "Mitarbeiter zuweisen"}</strong><span>{employee ? `${employee.name} · ${employee.specialization}` : workstation.index === 1 ? "Manuelle Zuweisung" : "Diese Station benötigt Personal"}</span></div>
      )}

      {workstation.index > 1 && (
        <div className="automation-controls">
          <button className={workstation.automationEnabled ? "is-on" : ""} disabled={!employee} onClick={() => onToggleAutomation(workstation.id)}>
            <Bot size={15} /> Auto Repair: {workstation.automationEnabled ? "ON" : "OFF"}
          </button>
          <select disabled={!employee || !workstation.automationEnabled} value={workstation.automationPriority} onChange={(event) => onSetPriority(workstation.id, event.target.value as AutomationPriority)} aria-label={`Priorität für Arbeitsplatz ${workstation.index}`}>
            {PRIORITIES.filter((priority) => priority.value !== "fastest-jobs" || state.researchedNodes.includes("advanced-automation") || workstation.automationPriority === "fastest-jobs").map((priority) => <option key={priority.value} value={priority.value}>{priority.label}{priority.value === "fastest-jobs" && !state.researchedNodes.includes("advanced-automation") ? " (gesperrt)" : ""}</option>)}
          </select>
        </div>
      )}
    </article>
  );
}

export function WorkstationDeck(props: WorkstationDeckProps) {
  const unlocked = props.state.workstations.filter((station) => station.status !== "locked").length;
  return (
    <section className="station-section">
      <div className="station-section-head"><div><p className="panel-label">WERKHALLE // PARALLEL</p><h3>Arbeitsplätze</h3></div><span>{unlocked}/4 aktiv</span></div>
      <div className="station-grid">
        {props.state.workstations.map((workstation) => <StationCard key={workstation.id} workstation={workstation} {...props} />)}
      </div>
    </section>
  );
}

