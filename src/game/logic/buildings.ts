import { BUILDING_TYPES, createInitialBuildings, getBuildingDefinition, getBuildingLevelDefinition, getBuildingState } from "@/game/data/buildings";
import { applyTransaction } from "@/game/logic/economy";
import type { BuildingRequirement, BuildingState, BuildingType, GameState } from "@/game/types";

export function isBuildingRequirementMet(state: GameState, requirement: BuildingRequirement) {
  if (requirement.type === "companyLevel") return state.companyLevel >= requirement.value;
  if (requirement.type === "reputation") return state.reputation >= requirement.value;
  if (requirement.type === "research") return state.researchedNodes.includes(requirement.value);
  return (getBuildingState(state, requirement.buildingId)?.level ?? 0) >= requirement.value;
}

export function getBuildingRequirementLabel(requirement: BuildingRequirement) {
  if (requirement.type === "companyLevel") return `Company-Level ${requirement.value}`;
  if (requirement.type === "reputation") return `Reputation ${requirement.value}`;
  if (requirement.type === "research") return `Research: ${requirement.value.replaceAll("-", " ")}`;
  return `${getBuildingDefinition(requirement.buildingId).name} Level ${requirement.value}`;
}

export function getBuildingUpgradeCheck(state: GameState, buildingId: BuildingType) {
  const building = getBuildingState(state, buildingId);
  const definition = getBuildingDefinition(buildingId);
  const next = getBuildingLevelDefinition(buildingId, (building?.level ?? 0) + 1);
  if (!building?.unlocked) return { available: false, reason: "Gebäude ist gesperrt", next: null };
  if (!next) return { available: false, reason: "Maximalstufe erreicht", next: null };
  const missing = next.requirements.find((requirement) => !isBuildingRequirementMet(state, requirement));
  if (missing) return { available: false, reason: `${getBuildingRequirementLabel(missing)} benötigt`, next };
  if (next.cost < 0 || !Number.isFinite(next.cost)) return { available: false, reason: "Ungültige Ausbaukosten", next };
  if (state.money < next.cost) return { available: false, reason: `${next.cost - state.money} € fehlen`, next };
  return { available: true, reason: `${definition.name} ausbauen`, next };
}

export function refreshBuildingStates(state: GameState) {
  const buildings = state.buildings.map((building) => {
    const definition = getBuildingDefinition(building.buildingId);
    const level = Math.max(1, Math.min(definition.levels.length, Number.isFinite(building.level) ? Math.floor(building.level) : 1));
    const visualTier = getBuildingLevelDefinition(building.buildingId, level)?.visualTier ?? 1;
    const next = getBuildingLevelDefinition(building.buildingId, level + 1);
    const requirementsReady = next?.requirements.every((requirement) => isBuildingRequirementMet({ ...state, buildings: state.buildings }, requirement)) ?? false;
    return { ...building, level, unlocked: true, visualTier: Math.max(1, Math.min(definition.maxHandcraftedTier, visualTier)), upgradeState: next && requirementsReady ? "UPGRADE_AVAILABLE" as const : "OWNED" as const };
  });
  return { ...state, buildings };
}

export function upgradeBuilding(state: GameState, buildingId: BuildingType, now: number) {
  const check = getBuildingUpgradeCheck(state, buildingId);
  if (!check.available || !check.next) return { state, error: check.reason };
  const current = getBuildingState(state, buildingId);
  const next = check.next;
  let charged = applyTransaction(state, "BUILDING_UPGRADE", -next.cost, `${buildingId}-${next.level}`, now);
  const event = { buildingId, oldLevel: current.level, newLevel: next.level, oldVisualTier: current.visualTier, newVisualTier: next.visualTier, unlockedFeatures: next.unlocks, createdAt: now };
  charged = {
    ...charged,
    buildings: charged.buildings.map((building) => building.buildingId === buildingId ? { ...building, level: next.level, visualTier: next.visualTier, upgradeState: "OWNED" as const } : building),
    lastBuildingUpgrade: event,
    lifetimeStats: {
      ...charged.lifetimeStats,
      buildingUpgradesPurchased: charged.lifetimeStats.buildingUpgradesPurchased + 1,
      moneyInvestedInBuildings: charged.lifetimeStats.moneyInvestedInBuildings + next.cost,
      highestWorkshopLevel: buildingId === "WORKSHOP" ? Math.max(charged.lifetimeStats.highestWorkshopLevel, next.level) : charged.lifetimeStats.highestWorkshopLevel,
    },
  };
  return { state: refreshBuildingStates(charged), error: null };
}

function minimumLevelForLegacy(buildingId: BuildingType, value: number) {
  const definition = getBuildingDefinition(buildingId);
  return Math.max(1, Math.min(definition.levels.length, value));
}

export function migrateBuildings(value: unknown, legacy: Pick<GameState, "workstations" | "employees" | "ownedTools" | "researchedNodes" | "contracts">): BuildingState[] {
  const saved = Array.isArray(value) ? value as Partial<BuildingState>[] : [];
  const highestStation = legacy.workstations.reduce((max, station) => station.status !== "locked" ? Math.max(max, station.index) : max, 1);
  const toolLevel = legacy.ownedTools.includes("microscope") ? 3 : legacy.ownedTools.some((tool) => ["soldering-station", "hot-air-station"].includes(tool)) ? 2 : 1;
  const researchLevel = legacy.researchedNodes.some((node) => ["contract-management", "advanced-automation", "offline-operations"].includes(node)) ? 3 : legacy.researchedNodes.some((node) => ["advanced-repair", "specialized-repair", "management-systems"].includes(node)) ? 2 : 1;
  const personnelLevel = legacy.employees.length > 4 ? 3 : legacy.employees.length > 2 ? 2 : 1;
  const officeLevel = legacy.contracts.filter((contract) => contract.status === "active").length > 2 ? 3 : legacy.contracts.filter((contract) => contract.status === "active").length > 1 ? 2 : 1;
  const minimums: Record<BuildingType, number> = { WORKSHOP: highestStation, PERSONNEL: personnelLevel, FINANCE: 1, TOOL_WAREHOUSE: toolLevel, RESEARCH: researchLevel, BUSINESS_OFFICE: officeLevel };
  return createInitialBuildings().map((fallback) => {
    const candidate = saved.find((building) => building.buildingId === fallback.buildingId);
    const rawLevel = typeof candidate?.level === "number" && Number.isFinite(candidate.level) ? Math.floor(candidate.level) : 1;
    const level = minimumLevelForLegacy(fallback.buildingId, Math.max(rawLevel, minimums[fallback.buildingId]));
    return { ...fallback, ...candidate, buildingId: fallback.buildingId, level, unlocked: true, visualTier: getBuildingLevelDefinition(fallback.buildingId, level)?.visualTier ?? 1, upgradeState: "OWNED" as const, cosmeticTheme: typeof candidate?.cosmeticTheme === "string" ? candidate.cosmeticTheme : null };
  }).filter((building) => BUILDING_TYPES.includes(building.buildingId));
}
