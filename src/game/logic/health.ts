import { COSMETICS } from "@/game/data/cosmetics";
import type { GameState } from "@/game/types";

export function getGameStateIssues(state: GameState) {
  const issues: string[] = [];
  if (!Number.isFinite(state.money)) issues.push("Money ist nicht finite");
  if (!Number.isFinite(state.lifetimeXp) || state.lifetimeXp < 0) issues.push("XP ist ungültig");
  if (!Number.isFinite(state.companyLevel) || state.companyLevel < 1) issues.push("Company Level ist ungültig");
  if (state.buildings.some((building) => building.level < 1 || !Number.isFinite(building.level))) issues.push("Gebäudelevel ist ungültig");
  if (state.workstations.some((station) => station.assignedEmployeeId && !state.employees.some((employee) => employee.id === station.assignedEmployeeId))) issues.push("Workstation referenziert unbekannten Mitarbeiter");
  if (state.workstations.some((station) => station.activeRepair && !station.activeRepair.order?.id)) issues.push("Aktive Reparatur besitzt keinen Auftrag");
  if (new Set(state.completedRepairs.map((repair) => repair.id)).size !== state.completedRepairs.length) issues.push("Doppelte Reparaturauszahlung erkannt");
  if (state.cosmeticEntitlements.some((entry) => !COSMETICS.some((cosmetic) => cosmetic.cosmeticId === entry.cosmeticId))) issues.push("Unbekanntes Cosmetic-Entitlement");
  return issues;
}
export function isImportableSave(value: unknown): value is Partial<GameState> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GameState>;
  return Number.isFinite(candidate.saveVersion) && Array.isArray(candidate.workstations) && Array.isArray(candidate.availableOrders) && typeof candidate.identity === "object";
}
