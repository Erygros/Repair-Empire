import type { EmployeeCandidate, EmployeeClass, RepairCategory, Workstation } from "@/game/types";

interface EmployeeClassTemplate {
  class: EmployeeClass;
  baseCost: number;
  speed: number;
  skill: number;
  quality: number;
  requiredReputation: number;
}

export const EMPLOYEE_CLASSES: EmployeeClassTemplate[] = [
  { class: "Apprentice", baseCost: 680, speed: 0.82, skill: 12, quality: 72, requiredReputation: 10 },
  { class: "Junior Technician", baseCost: 1_350, speed: 1, skill: 24, quality: 82, requiredReputation: 18 },
  { class: "Technician", baseCost: 2_750, speed: 1.12, skill: 38, quality: 88, requiredReputation: 32 },
  { class: "Senior Technician", baseCost: 5_400, speed: 1.26, skill: 55, quality: 93, requiredReputation: 50 },
  { class: "Specialist", baseCost: 8_800, speed: 1.36, skill: 72, quality: 97, requiredReputation: 72 },
];

export const EMPLOYEE_XP_THRESHOLDS = [0, 70, 175, 320, 520, 780, 1_100];
export const MARKET_REFRESH_COST = 180;
export const SPECIALIZATIONS: RepairCategory[] = ["Mobile Devices", "Consoles", "Computers", "Electronics"];
const FIRST_NAMES = ["Lena", "Jonas", "Mira", "Noah", "Aylin", "David", "Nora", "Emil", "Sofia", "Leon"];
const LAST_NAMES = ["Weber", "Keller", "Novak", "Berger", "Nguyen", "Fischer", "Kaya", "Winter", "Hoffmann", "Brandt"];

function pick<T>(items: T[]): T { return items[Math.floor(Math.random() * items.length)]; }
function vary(base: number, range: number) { return Math.round((base + (Math.random() * 2 - 1) * range) * 100) / 100; }

export function generateCandidate(candidateNumber: number, reputation: number): EmployeeCandidate {
  const eligible = EMPLOYEE_CLASSES.filter((template) => template.requiredReputation <= reputation + 12);
  const template = pick(eligible.length > 0 ? eligible : EMPLOYEE_CLASSES.slice(0, 1));
  const skill = Math.max(5, Math.round(vary(template.skill, 4)));
  const quality = Math.max(60, Math.min(99, Math.round(vary(template.quality, 4))));
  const speed = Math.max(0.7, vary(template.speed, 0.07));
  const hiringCost = Math.round(template.baseCost * (0.88 + Math.random() * 0.24) / 10) * 10;
  return {
    id: `EMP-${String(candidateNumber).padStart(4, "0")}`,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    class: template.class,
    hiringCost,
    speed,
    skill,
    quality,
    specialization: pick(SPECIALIZATIONS),
  };
}

export function generateCandidateMarket(firstNumber: number, reputation: number, count = 4) {
  return Array.from({ length: count }, (_, index) => generateCandidate(firstNumber + index, reputation));
}

export const WORKSTATION_CONFIG = [
  { purchasePrice: 0, requiredReputation: 0 },
  { purchasePrice: 1_800, requiredReputation: 18 },
  { purchasePrice: 5_200, requiredReputation: 38 },
  { purchasePrice: 12_000, requiredReputation: 68 },
] as const;

export function createInitialWorkstations(): Workstation[] {
  return WORKSTATION_CONFIG.map((config, index) => ({
    id: `WS-${index + 1}`,
    index: index + 1,
    status: index === 0 ? "available" : "locked",
    purchasePrice: config.purchasePrice,
    requiredReputation: config.requiredReputation,
    assignedEmployeeId: null,
    activeRepair: null,
    automationEnabled: false,
    automationPriority: "highest-profit",
  }));
}

