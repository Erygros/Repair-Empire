import { BriefcaseBusiness, FlaskConical, Landmark, PackageOpen, UsersRound, Wrench } from "lucide-react";
import { getBuildingDefinition, getBuildingState } from "@/game/data/buildings";
import type { BuildingType, GameState } from "@/game/types";
import type { CampusPlot } from "@/game/data/campus";

const ICONS = { WORKSHOP: Wrench, PERSONNEL: UsersRound, FINANCE: Landmark, TOOL_WAREHOUSE: PackageOpen, RESEARCH: FlaskConical, BUSINESS_OFFICE: BriefcaseBusiness } satisfies Record<BuildingType, typeof Wrench>;

export function CampusBuilding({ plot, state, notification, selected, recentUpgrade, onSelect }: { plot: CampusPlot; state: GameState; notification: string | null; selected: boolean; recentUpgrade: boolean; onSelect: (buildingId: BuildingType) => void }) {
  const building = getBuildingState(state, plot.buildingId);
  const definition = getBuildingDefinition(plot.buildingId);
  const Icon = ICONS[plot.buildingId];
  const tier = Math.max(1, building.visualTier);
  const segments = plot.buildingId === "WORKSHOP" ? tier : Math.min(3, tier);
  const windows = plot.buildingId === "TOOL_WAREHOUSE" ? tier + 1 : tier * 2;
  return (
    <button
      className={`campus-building campus-${plot.buildingId.toLowerCase().replaceAll("_", "-")} tier-${tier} ${selected ? "selected" : ""} ${recentUpgrade ? "recent-upgrade" : ""}`}
      style={{ left: plot.x, top: plot.y, width: plot.width, height: plot.depth }}
      onClick={() => onSelect(plot.buildingId)}
      aria-label={`${definition.name}, Level ${building.level}, Visual Tier ${tier}`}
    >
      <span className="building-ground" />
      <span className="building-structure">
        <span className="building-roof">{Array.from({ length: segments }, (_, index) => <i key={index} />)}</span>
        <span className="building-facade">
          <span className="building-windows">{Array.from({ length: windows }, (_, index) => <i key={index} />)}</span>
          <span className="building-door" />
          {tier >= 2 && <span className="building-annex" />}
          {tier >= 3 && <span className="building-tech"><i /><i /><i /></span>}
          {tier >= 4 && <span className="building-stack"><i /><i /></span>}
          {tier >= 5 && <span className="building-crown" />}
        </span>
      </span>
      <span className="building-map-label"><Icon size={15} /><span>{definition.name}<small>{plot.label} · LVL {building.level}</small></span></span>
      {notification && <span className="building-notification">{notification}</span>}
    </button>
  );
}
