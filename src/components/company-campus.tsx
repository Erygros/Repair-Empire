import { Banknote, BriefcaseBusiness, Building2, Check, FlaskConical, Landmark, LockKeyhole, PackageOpen, UsersRound, Wrench } from "lucide-react";
import { BUILDING_DEFINITIONS, getBuildingLevelDefinition, getBuildingState } from "@/game/data/buildings";
import { getBuildingRequirementLabel, getBuildingUpgradeCheck, isBuildingRequirementMet } from "@/game/logic/buildings";
import type { BuildingType, GameState } from "@/game/types";
import { formatMoney } from "@/utils/format";

const ICONS = { WORKSHOP: Wrench, PERSONNEL: UsersRound, FINANCE: Landmark, TOOL_WAREHOUSE: PackageOpen, RESEARCH: FlaskConical, BUSINESS_OFFICE: BriefcaseBusiness } satisfies Record<BuildingType, typeof Wrench>;

export function CompanyCampus({ state, onUpgrade }: { state: GameState; onUpgrade: (buildingId: BuildingType) => void }) {
  return (
    <div className="campus-layout">
      <header className="campus-summary">
        <div><p className="panel-label">COMPANY PROPERTY // AUSBAU</p><h3>{state.identity.companyName}</h3><p>Persistenter Unternehmensstand als Grundlage der kommenden Firmen-Map.</p></div>
        <div><span><Building2 size={16} /> Gebäude</span><strong>{state.buildings.filter((building) => building.unlocked).length}</strong></div>
        <div><span><Wrench size={16} /> Workshop</span><strong>Level {getBuildingState(state, "WORKSHOP").level}</strong></div>
        <div><span><Banknote size={16} /> Investiert</span><strong>{formatMoney(state.lifetimeStats.moneyInvestedInBuildings)}</strong></div>
      </header>
      <section className="building-grid">
        {BUILDING_DEFINITIONS.map((definition) => {
          const building = getBuildingState(state, definition.buildingId);
          const current = getBuildingLevelDefinition(definition.buildingId, building.level)!;
          const check = getBuildingUpgradeCheck(state, definition.buildingId);
          const next = check.next;
          const Icon = ICONS[definition.buildingId];
          return (
            <article className={`building-card tier-${building.visualTier}`} key={definition.buildingId}>
              <header><div className="building-icon"><Icon size={22} /></div><div><span>{definition.mapSlot} · Visual Tier {building.visualTier}</span><h4>{definition.name}</h4></div><b>LVL {building.level}</b></header>
              <p>{current.description}</p>
              <div className="building-tier" aria-label={`Visual Tier ${building.visualTier} von ${definition.maxHandcraftedTier}`}>{Array.from({ length: definition.maxHandcraftedTier }, (_, index) => <i className={index < building.visualTier ? "active" : ""} key={index} />)}</div>
              <div className="building-benefits"><span>Aktiv</span>{current.unlocks.map((unlock) => <small key={unlock}><Check size={12} />{unlock}</small>)}</div>
              {next ? <div className="building-next"><span>Nächster Ausbau · Level {next.level}</span><strong>{next.name}</strong><p>{next.unlocks.join(" · ")}</p><div className="building-requirements">{next.requirements.map((requirement) => <em className={isBuildingRequirementMet(state, requirement) ? "met" : "missing"} key={getBuildingRequirementLabel(requirement)}>{isBuildingRequirementMet(state, requirement) ? <Check size={11} /> : <LockKeyhole size={11} />}{getBuildingRequirementLabel(requirement)}</em>)}</div><button disabled={!check.available} onClick={() => onUpgrade(definition.buildingId)}>{check.available ? `${formatMoney(next.cost)} investieren` : check.reason}</button></div> : <div className="building-max"><Check size={16} /> Maximale Ausbaustufe</div>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
