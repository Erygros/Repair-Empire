"use client";

import { useState } from "react";
import { Bot, Check, Clock3, ListChecks, Settings2, UserRound } from "lucide-react";
import { OrderBoard } from "@/components/order-board";
import { RepairLog } from "@/components/repair-log";
import { WorkshopScene } from "@/components/workshop-scene";
import { WorkstationDeck } from "@/components/workstation-deck";
import { getRepairOperatingCost, getRepairProgress } from "@/game/logic/game";
import type { AutomationPriority, GameState } from "@/game/types";
import { formatClock, formatMoney } from "@/utils/format";

type Panel = "JOBS" | "STATION" | "LOG";

export function WorkshopExperience({ state, now, onAccept, onPurchase, onComplete, onAssignEmployee, onToggleAutomation, onSetPriority, motion }: { state: GameState; now: number; onAccept: (id: string) => string | null; onPurchase: (id: string) => void; onComplete: (id: string) => void; onAssignEmployee: (stationId: string, employeeId: string | null) => void; onToggleAutomation: (id: string) => void; onSetPriority: (id: string, priority: AutomationPriority) => void; motion?: "AUTO" | "FULL" | "REDUCED" }) {
  const initialStation = state.workstations.find(item => item.status === "completed") ?? state.workstations.find(item => item.activeRepair) ?? state.workstations[0];
  const [selectedId, setSelectedId] = useState(initialStation?.id ?? "");
  const [panel, setPanel] = useState<Panel>(initialStation?.activeRepair ? "STATION" : "JOBS");
  const station = state.workstations.find((item) => item.id === selectedId) ?? state.workstations[0];
  const active = station?.activeRepair ?? null;
  const progress = getRepairProgress(active, now);
  const employee = station?.assignedEmployeeId ? state.employees.find((item) => item.id === station.assignedEmployeeId) : null;
  const profit = active && station ? active.order.reward - active.chargedMaterialCost - getRepairOperatingCost(state, active, station) : 0;
  return <div className="workshop-experience workshop-industrial">
    <WorkshopScene state={state} now={now} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setPanel("STATION"); }} motion={motion} />
    <aside className="workshop-control-panel">
      <nav aria-label="Werkstattsteuerung"><button className={panel === "JOBS" ? "active" : ""} onClick={() => setPanel("JOBS")}><ListChecks size={16} />Aufträge</button><button className={panel === "STATION" ? "active" : ""} onClick={() => setPanel("STATION")}><Settings2 size={16} />Station</button><button className={panel === "LOG" ? "active" : ""} onClick={() => setPanel("LOG")}><Check size={16} />Verlauf</button></nav>
      {panel === "JOBS" && <OrderBoard orders={state.availableOrders} money={state.money} reputation={state.reputation} ownedTools={state.ownedTools} upgrades={state.upgrades} researchedNodes={state.researchedNodes} now={now} onAccept={id => { const assigned = onAccept(id); if (assigned) { setSelectedId(assigned); setPanel("STATION"); } }} />}
      {panel === "STATION" && station && <section className="station-focus panel"><div className="panel-header"><div><p className="panel-label">ARBEITSPLATZ {String(station.index).padStart(2, "0")}</p><h3>{active?.order.device ?? (station.status === "locked" ? "Ausbaufläche" : "Bereit")}</h3></div><span className={`state-chip ${station.status}`}>{station.status}</span></div>
        {active ? <><h4>{active.order.issue}</h4><p>{active.order.customer} · {active.order.id}</p><div className="focus-metrics"><span><Clock3 size={14} />{formatClock(active.endsAt - now)}</span><span><UserRound size={14} />{employee?.name ?? state.playerCharacter?.displayName ?? "Founder"}</span><span><Bot size={14} />{station.automationEnabled ? "Auto" : "Manuell"}</span><strong>{formatMoney(profit)} Gewinn</strong></div><div className="station-progress"><span style={{ width: `${progress}%` }} /></div>{!station.automationEnabled && <button className="station-complete" disabled={progress < 100} onClick={() => onComplete(station.id)}>{progress >= 100 ? "Reparatur abnehmen" : `${Math.floor(progress)} % abgeschlossen`}</button>}</> : <p className="focus-empty">{station.status === "locked" ? "Voraussetzungen und Kaufoptionen findest du in der Stationsverwaltung." : "Wähle einen passenden Auftrag. Das Gerät erscheint danach direkt an dieser Werkbank."}</p>}
      </section>}
      {panel === "STATION" && <details className="station-management"><summary>Stationsverwaltung</summary><WorkstationDeck state={state} now={now} onPurchase={onPurchase} onComplete={onComplete} onAssignEmployee={onAssignEmployee} onToggleAutomation={onToggleAutomation} onSetPriority={onSetPriority} /></details>}
      {panel === "LOG" && <RepairLog repairs={state.completedRepairs} />}
    </aside>
  </div>;
}
