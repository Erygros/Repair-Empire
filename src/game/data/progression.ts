import type { ToolDefinition, ToolId, UpgradeDefinition, UpgradeId, UpgradeLevels } from "@/game/types";

export const SAVE_VERSION = 3;
export const INITIAL_UPGRADES: UpgradeLevels = {
  "efficient-workflow": 0,
  "better-diagnostics": 0,
  "customer-network": 0,
  "workshop-organization": 0,
  "job-board-expansion": 0,
};

export const TOOLS: ToolDefinition[] = [
  { id: "basic-kit", name: "Basic Tool Kit", description: "Handwerkzeuge für sichere mechanische Standardreparaturen.", price: 0, requiredReputation: 0, unlocks: ["Akku & Gehäuse", "Kühlung & Tasten"] },
  { id: "multimeter", name: "Multimeter", description: "Misst Spannungen und findet elektrische Fehler zuverlässig.", price: 720, requiredReputation: 15, requiredTool: "basic-kit", unlocks: ["Stromdiagnose", "Kurzschlussprüfung"] },
  { id: "soldering-station", name: "Lötstation", description: "Für Anschlüsse, Kabel und einfache Arbeiten an Platinen.", price: 1_850, requiredReputation: 28, requiredTool: "multimeter", unlocks: ["Ladeanschlüsse", "Steckverbinder"] },
  { id: "hot-air-station", name: "Heißluftstation", description: "Löst und setzt anspruchsvolle SMD-Bauteile auf Mainboards.", price: 4_600, requiredReputation: 48, requiredTool: "soldering-station", unlocks: ["Board-Reparatur", "Speicherchips"] },
  { id: "microscope", name: "Mikroskop", description: "Präzisionsoptik für feinste Leiterbahnen und Mikrolötungen.", price: 8_400, requiredReputation: 72, requiredTool: "hot-air-station", unlocks: ["Mikrolötung", "Präzisionsdiagnose"] },
];

export const UPGRADES: UpgradeDefinition[] = [
  { id: "efficient-workflow", name: "Efficient Workflow", description: "Standardisierte Handgriffe verkürzen jede Reparatur.", baseCost: 220, costGrowth: 1.72, maxLevel: 5, requiredReputation: 10 },
  { id: "better-diagnostics", name: "Better Diagnostics", description: "Präzisere Fehlerbilder senken den Materialverbrauch.", baseCost: 310, costGrowth: 1.76, maxLevel: 5, requiredReputation: 12 },
  { id: "customer-network", name: "Customer Network", description: "Bessere Kontakte bringen lukrativere Kunden in die Werkstatt.", baseCost: 480, costGrowth: 1.8, maxLevel: 5, requiredReputation: 20 },
  { id: "workshop-organization", name: "Workshop Organization", description: "Klare Abläufe erhöhen Tempo und Auszahlungsqualität.", baseCost: 390, costGrowth: 1.78, maxLevel: 5, requiredReputation: 16 },
  { id: "job-board-expansion", name: "Job Board Expansion", description: "Zusätzliche Eingangskanäle erweitern die Auftragsauswahl.", baseCost: 560, costGrowth: 1.9, maxLevel: 5, requiredReputation: 18 },
];

export const REPUTATION_MILESTONES = [15, 28, 48, 72];
export const REPAIR_LEVEL_THRESHOLDS = [0, 40, 105, 200, 330, 500, 720, 1_000];

export function getTool(toolId: ToolId) { return TOOLS.find((tool) => tool.id === toolId)!; }
export function getUpgrade(upgradeId: UpgradeId) { return UPGRADES.find((upgrade) => upgrade.id === upgradeId)!; }

