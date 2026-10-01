import type { ResearchCategory, ResearchId, ToolDefinition, ToolId, UpgradeDefinition, UpgradeId, UpgradeLevels } from "@/game/types";

export const SAVE_VERSION = 5;
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
export const PROGRESSION_BALANCE = {
  xpPowerFactor: 18,
  xpPower: 1.55,
  xpQuadraticFactor: 3,
  researchPointEveryLevels: 5,
  activeChallengeCount: 3,
  dailyChallengeCount: 3,
} as const;

export function totalXpForLevel(level: number) {
  const normalized = Math.max(0, Math.floor(level) - 1);
  return Math.round(PROGRESSION_BALANCE.xpPowerFactor * normalized ** PROGRESSION_BALANCE.xpPower + PROGRESSION_BALANCE.xpQuadraticFactor * normalized ** 2);
}

export function getCompanyLevel(lifetimeXp: number) {
  const xp = Math.max(0, Number.isFinite(lifetimeXp) ? lifetimeXp : 0);
  let low = 1;
  let high = Math.max(2, Math.floor(Math.sqrt(xp / PROGRESSION_BALANCE.xpQuadraticFactor)) + 3);
  while (totalXpForLevel(high) <= xp) high *= 2;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (totalXpForLevel(middle) <= xp) low = middle;
    else high = middle;
  }
  return low;
}

export function getCompanyLevelProgress(lifetimeXp: number) {
  const level = getCompanyLevel(lifetimeXp);
  const currentThreshold = totalXpForLevel(level);
  const nextThreshold = totalXpForLevel(level + 1);
  return { level, current: lifetimeXp - currentThreshold, required: nextThreshold - currentThreshold, percent: ((lifetimeXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100 };
}

export function getResearchPointsForLevels(fromLevel: number, toLevel: number) {
  return Math.max(0, Math.floor(toLevel / PROGRESSION_BALANCE.researchPointEveryLevels) - Math.floor(fromLevel / PROGRESSION_BALANCE.researchPointEveryLevels));
}

export interface ResearchDefinition {
  id: ResearchId;
  category: ResearchCategory;
  name: string;
  description: string;
  cost: number;
  requiredLevel: number;
  requires: ResearchId[];
  effect: string;
}

export const RESEARCH_NODES: ResearchDefinition[] = [
  { id: "basic-diagnostics", category: "Diagnostics", name: "Basic Diagnostics", description: "Zeigt technische Fehlerbilder direkt am Auftrag.", cost: 1, requiredLevel: 3, requires: [], effect: "Diagnose sichtbar" },
  { id: "advanced-diagnostics", category: "Diagnostics", name: "Advanced Diagnostics", description: "Legt Qualitäts- und Skill-Anforderungen präziser offen.", cost: 2, requiredLevel: 8, requires: ["basic-diagnostics"], effect: "Erweiterte Jobdaten" },
  { id: "job-analysis", category: "Diagnostics", name: "Job Analysis", description: "Berechnet den erwarteten Gewinn pro Minute.", cost: 2, requiredLevel: 12, requires: ["advanced-diagnostics"], effect: "Profit/Minute sichtbar" },
  { id: "material-efficiency", category: "Repair Technology", name: "Efficient Material Usage", description: "Standardisierte Teileprüfung senkt Materialverluste.", cost: 3, requiredLevel: 16, requires: ["basic-diagnostics"], effect: "8 % weniger Materialkosten" },
  { id: "advanced-repair", category: "Repair Technology", name: "Advanced Repair Methods", description: "Neue Prozessfenster für Professional- und Expert-Jobs.", cost: 2, requiredLevel: 20, requires: [], effect: "Premium-Aufträge früher" },
  { id: "specialized-repair", category: "Repair Technology", name: "Specialized Repair", description: "Spezialisierte Techniker nutzen ihr Fachwissen effektiver.", cost: 3, requiredLevel: 28, requires: ["advanced-repair"], effect: "25 % Spezialisierungsbonus" },
  { id: "management-systems", category: "Management", name: "Management Systems", description: "Strukturierte Annahme schafft einen zusätzlichen Job-Slot.", cost: 2, requiredLevel: 18, requires: [], effect: "+1 Job-Board-Slot" },
  { id: "advanced-automation", category: "Automation", name: "Advanced Automation", description: "Auto Repair kann nach Gewinn pro Minute priorisieren.", cost: 3, requiredLevel: 25, requires: ["management-systems"], effect: "Priorität Fastest Jobs" },
  { id: "offline-operations", category: "Automation", name: "Offline Operations", description: "Schichtpläne erweitern den produktiven Offline-Betrieb.", cost: 4, requiredLevel: 35, requires: ["advanced-automation"], effect: "12 Stunden Offline-Kapazität" },
];

export function getTool(toolId: ToolId) { return TOOLS.find((tool) => tool.id === toolId)!; }
export function getUpgrade(upgradeId: UpgradeId) { return UPGRADES.find((upgrade) => upgrade.id === upgradeId)!; }

