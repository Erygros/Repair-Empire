import type { ReactNode } from "react";
import { ArrowLeft, Building2, ChevronsUp } from "lucide-react";
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
        <button className="back-to-map" onClick={onClose}><ArrowLeft size={17} /> Campus</button>
        <div><span>{definition.mapSlot} · Visual Tier {building.visualTier}</span><h2>{definition.name}</h2></div>
        <div className="building-view-level"><Building2 size={16} /><span>Gebäudelevel</span><strong>{building.level}</strong></div>
        {check.next && <button className="quick-building-upgrade" disabled={!check.available} onClick={() => onUpgrade(buildingId)} title={check.reason}><ChevronsUp size={16} />{check.available ? `${formatMoney(check.next.cost)} ausbauen` : check.reason}</button>}
      </header>
      <div className="building-view-content">{children}</div>
    </section>
  );
}
