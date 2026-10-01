import { memo } from "react";
import { Bot, Check, LockKeyhole, Radio, Wrench } from "lucide-react";
import { DeviceVisual } from "@/components/device-visual";
import { TechnicianVisual } from "@/components/technician-visual";
import { getRepairVisualPhase, getRepairVisualProfile } from "@/game/data/workshop-visuals";
import { getRepairProgress } from "@/game/logic/game";
import type { GameState, Workstation } from "@/game/types";

function WorkshopStation({ station, state, now, selected, onSelect }: { station: Workstation; state: GameState; now: number; selected: boolean; onSelect: () => void }) {
  const progress = getRepairProgress(station.activeRepair, now);
  const phase = getRepairVisualPhase(station.activeRepair?.order ?? null, progress, station.status === "completed");
  const employee = station.assignedEmployeeId ? state.employees.find((item) => item.id === station.assignedEmployeeId) ?? null : null;
  const profile = station.activeRepair ? getRepairVisualProfile(station.activeRepair.order) : null;
  if (station.status === "locked") return <button className={`workshop-station locked ${selected ? "selected" : ""}`} onClick={onSelect}><span className="station-floor-mark">WS-{String(station.index).padStart(2, "0")}</span><div className="locked-bay"><LockKeyhole size={24} /><strong>Ausbaufläche</strong><span>Level {station.requiredLevel}</span></div></button>;
  return <button className={`workshop-station phase-${phase.toLowerCase()} ${selected ? "selected" : ""}`} onClick={onSelect} aria-label={`Arbeitsplatz ${station.index}, ${phase}`}>
    <span className="station-floor-mark">WS-{String(station.index).padStart(2, "0")}</span>
    <div className="station-light"><i />{station.automationEnabled && <Bot size={12} />}</div>
    <div className="station-wall"><span /><span /><span /></div>
    <div className="station-bench-visual"><i className="bench-top" /><i className="bench-leg left" /><i className="bench-leg right" /><i className="tool-rack">{profile?.tool === "multimeter" ? <Radio size={15} /> : <Wrench size={15} />}</i></div>
    {station.activeRepair && <DeviceVisual device={station.activeRepair.order.device} phase={phase} />}
    {(station.index === 1 || employee) && <TechnicianVisual employee={employee} phase={phase} founderName={state.playerCharacter?.displayName} />}
    <div className="station-visual-status"><span>{phase === "IDLE" ? "BEREIT" : phase}</span>{station.activeRepair && <i><b style={{ width: `${progress}%` }} /></i>}{phase === "COMPLETED" && <Check size={15} />}</div>
  </button>;
}

function WorkshopSceneComponent({ state, now, selectedId, onSelect }: { state: GameState; now: number; selectedId: string; onSelect: (id: string) => void }) {
  const working = state.workstations.filter((station) => station.activeRepair).length;
  return <section className="workshop-scene" aria-label="Visuelle Werkstatt">
    <header><div><p className="panel-label">LIVE FLOOR // {working} AKTIV</p><h3>Produktionshalle</h3></div><span className="scene-live"><i /> Echtzeit</span></header>
    <div className="workshop-room"><div className="workshop-ceiling"><i /><i /><i /></div><div className="diagnostic-bus" aria-hidden="true" />
      <div className="workshop-stations">{state.workstations.map((station) => <WorkshopStation key={station.id} station={station} state={state} now={now} selected={selectedId === station.id} onSelect={() => onSelect(station.id)} />)}</div>
      <div className="workshop-floor-lines" aria-hidden="true" />
    </div>
  </section>;
}

export const WorkshopScene = memo(WorkshopSceneComponent);
