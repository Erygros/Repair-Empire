import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BuildingsIcon as Building2, ExpandIcon as ChevronsUp } from "@/components/repair-icons";
import { getBuildingDefinition, getBuildingState } from "@/game/data/buildings";
import { getBuildingUpgradeCheck } from "@/game/logic/buildings";
import type { BuildingType, GameState } from "@/game/types";
import { formatMoney } from "@/utils/format";

export function BuildingViewShell({ buildingId, state, onClose, onUpgrade, children }: { buildingId: BuildingType; state: GameState; onClose: () => void; onUpgrade: (id: BuildingType) => void; children: ReactNode }) {
  const definition = getBuildingDefinition(buildingId);
  const building = getBuildingState(state, buildingId);
  const check = getBuildingUpgradeCheck(state, buildingId);
  return (
    <section className="building-view-shell">
      <header className="building-view-header">
        <button className="back-to-map" onClick={onClose} title="Zur Firmenkarte" aria-label="Zur Firmenkarte"><ArrowLeft size={17} /></button>
        <div><span>Level {building.level}</span><h2>{buildingId === "WORKSHOP" ? "Werkstatt" : definition.name}</h2></div>
        <div className="building-view-level"><Building2 size={16} /><span>Gebäudelevel</span><strong>{building.level}</strong></div>
        {check.next && <details className="building-expansion"><summary><ChevronsUp size={16} />Ausbau</summary><div><strong>{check.next.name}</strong><p>{check.next.unlocks.filter(item => !item.startsWith("Visual Tier")).join(" · ")}</p>{!check.available && <p>{check.reason}</p>}<button className="quick-building-upgrade" disabled={!check.available} onClick={() => onUpgrade(buildingId)}>{formatMoney(check.next.cost)} investieren</button></div></details>}
      </header>
      <div className="building-view-content">{children}</div>
    </section>
  );
}
