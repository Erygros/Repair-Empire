import type { DeviceKind, RepairOrder, ToolId } from "@/game/types";

export type RepairVisualPhase = "IDLE" | "DIAGNOSING" | "REPAIRING" | "TESTING" | "COMPLETED";
export type RepairVisualProfileId = "COMPONENT_SWAP" | "CONNECTOR" | "DIAGNOSTIC" | "MAINTENANCE";

export interface RepairVisualProfile {
  id: RepairVisualProfileId;
  diagnoseUntil: number;
  repairUntil: number;
  testUntil: number;
  diagnoseAction: string;
  repairAction: string;
  testingAction: string;
  tool: ToolId;
}
export const DEVICE_VISUALS: Record<DeviceKind, { token: string; label: string; assetReference: string }> = {
  Smartphone: { token: "phone", label: "Smart Device", assetReference: "device.smartphone.prototype" },
  Controller: { token: "controller", label: "Control Unit", assetReference: "device.controller.prototype" },
  Handheld: { token: "handheld", label: "Portable System", assetReference: "device.handheld.prototype" },
  "Game Console": { token: "console", label: "Console Unit", assetReference: "device.console.prototype" },
  Tablet: { token: "tablet", label: "Touch Panel", assetReference: "device.tablet.prototype" },
  Laptop: { token: "laptop", label: "Mobile Computer", assetReference: "device.laptop.prototype" },
  "Audio Deck": { token: "audio", label: "Audio Module", assetReference: "device.audio.prototype" },
};

export const REPAIR_VISUAL_PROFILES: Record<RepairVisualProfileId, RepairVisualProfile> = {
  COMPONENT_SWAP: { id: "COMPONENT_SWAP", diagnoseUntil: 18, repairUntil: 78, testUntil: 96, diagnoseAction: "Gehäuse prüfen", repairAction: "Komponente einsetzen", testingAction: "Lasttest", tool: "basic-kit" },
  CONNECTOR: { id: "CONNECTOR", diagnoseUntil: 16, repairUntil: 82, testUntil: 96, diagnoseAction: "Kontakt prüfen", repairAction: "Verbindung bearbeiten", testingAction: "Signaltest", tool: "soldering-station" },
  DIAGNOSTIC: { id: "DIAGNOSTIC", diagnoseUntil: 28, repairUntil: 76, testUntil: 96, diagnoseAction: "Messpunkte prüfen", repairAction: "Fehler isolieren", testingAction: "Systemtest", tool: "multimeter" },
  MAINTENANCE: { id: "MAINTENANCE", diagnoseUntil: 14, repairUntil: 84, testUntil: 96, diagnoseAction: "Zustand prüfen", repairAction: "Wartung durchführen", testingAction: "Temperaturtest", tool: "basic-kit" },
};

export function getRepairVisualProfile(order: RepairOrder) {
  const text = `${order.issue} ${order.diagnostic}`.toLowerCase();
  if (text.includes("anschluss") || text.includes("port") || order.requiredTool === "soldering-station" || order.requiredTool === "hot-air-station") return REPAIR_VISUAL_PROFILES.CONNECTOR;
  if (text.includes("akku") || text.includes("taste") || text.includes("display")) return REPAIR_VISUAL_PROFILES.COMPONENT_SWAP;
  if (text.includes("kühl") || text.includes("reinig") || text.includes("lüfter")) return REPAIR_VISUAL_PROFILES.MAINTENANCE;
  return REPAIR_VISUAL_PROFILES.DIAGNOSTIC;
}
export function getRepairVisualPhase(order: RepairOrder | null, progress: number, completed: boolean): RepairVisualPhase {
  if (!order) return "IDLE";
  if (completed || progress >= 100) return "COMPLETED";
  const profile = getRepairVisualProfile(order);
  if (progress < profile.diagnoseUntil) return "DIAGNOSING";
  if (progress < profile.repairUntil) return "REPAIRING";
  return "TESTING";
}
