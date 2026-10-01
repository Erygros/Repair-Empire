import type { OrderTemplate } from "@/game/types";

export const ORDER_TEMPLATES: OrderTemplate[] = [
  { templateId: "phone-battery", device: "Smartphone", issue: "Akku tauschen", diagnostic: "Zellspannung instabil", durationSeconds: 14, materialCost: 24, reward: 104, reputationReward: 2, repairXp: 12, requiredReputation: 0, requiredTool: "basic-kit", skillRequirement: 5, category: "Mobile Devices", difficulty: 1 },
  { templateId: "controller-membrane", device: "Controller", issue: "Tastenmembran erneuern", diagnostic: "Eingaben werden ausgelassen", durationSeconds: 16, materialCost: 18, reward: 98, reputationReward: 3, repairXp: 13, requiredReputation: 5, requiredTool: "basic-kit", skillRequirement: 7, category: "Consoles", difficulty: 1 },
  { templateId: "console-cooling", device: "Game Console", issue: "Kühlsystem warten", diagnostic: "Temperaturlimit überschritten", durationSeconds: 22, materialCost: 34, reward: 164, reputationReward: 4, repairXp: 18, requiredReputation: 10, requiredTool: "basic-kit", skillRequirement: 12, category: "Consoles", difficulty: 2 },
  { templateId: "handheld-display", device: "Handheld", issue: "Display-Einheit tauschen", diagnostic: "Panel ohne Bildsignal", durationSeconds: 24, materialCost: 52, reward: 208, reputationReward: 4, repairXp: 20, requiredReputation: 12, requiredTool: "basic-kit", skillRequirement: 15, category: "Mobile Devices", difficulty: 2 },
  { templateId: "tablet-power-diagnosis", device: "Tablet", issue: "Strompfad diagnostizieren", diagnostic: "Stromaufnahme außerhalb der Norm", durationSeconds: 25, materialCost: 26, reward: 238, reputationReward: 5, repairXp: 24, requiredReputation: 15, requiredTool: "multimeter", skillRequirement: 18, category: "Mobile Devices", difficulty: 2 },
  { templateId: "laptop-fan", device: "Laptop", issue: "Lüftereinheit erneuern", diagnostic: "Drehzahlregelung außerhalb der Toleranz", durationSeconds: 28, materialCost: 48, reward: 250, reputationReward: 6, repairXp: 25, requiredReputation: 18, requiredTool: "multimeter", skillRequirement: 22, category: "Computers", difficulty: 2 },
  { templateId: "console-short-circuit", device: "Game Console", issue: "Kurzschluss lokalisieren", diagnostic: "Versorgungsschiene blockiert", durationSeconds: 29, materialCost: 38, reward: 286, reputationReward: 6, repairXp: 28, requiredReputation: 20, requiredTool: "multimeter", skillRequirement: 25, category: "Consoles", difficulty: 3 },
  { templateId: "phone-charge-port", device: "Smartphone", issue: "Ladeanschluss ersetzen", diagnostic: "Kontaktflächen beschädigt", durationSeconds: 32, materialCost: 58, reward: 372, reputationReward: 7, repairXp: 34, requiredReputation: 28, requiredTool: "soldering-station", skillRequirement: 30, category: "Mobile Devices", difficulty: 3 },
  { templateId: "audio-connector", device: "Audio Deck", issue: "Signalbuchse nachlöten", diagnostic: "Audiokanal unterbrochen", durationSeconds: 35, materialCost: 44, reward: 398, reputationReward: 8, repairXp: 36, requiredReputation: 32, requiredTool: "soldering-station", skillRequirement: 32, category: "Electronics", difficulty: 3 },
  { templateId: "laptop-power-rail", device: "Laptop", issue: "Power-Rail instand setzen", diagnostic: "Primärversorgung schaltet nicht frei", durationSeconds: 41, materialCost: 84, reward: 510, reputationReward: 10, repairXp: 44, requiredReputation: 42, requiredTool: "soldering-station", skillRequirement: 40, category: "Computers", difficulty: 4 },
  { templateId: "handheld-board", device: "Handheld", issue: "Power-Chip ersetzen", diagnostic: "Spannungsregler thermisch defekt", durationSeconds: 43, materialCost: 92, reward: 590, reputationReward: 10, repairXp: 46, requiredReputation: 48, requiredTool: "hot-air-station", skillRequirement: 42, category: "Mobile Devices", difficulty: 4 },
  { templateId: "console-memory", device: "Game Console", issue: "Speicherbaustein reworken", diagnostic: "Datenbus instabil", durationSeconds: 48, materialCost: 118, reward: 720, reputationReward: 12, repairXp: 54, requiredReputation: 55, requiredTool: "hot-air-station", skillRequirement: 50, category: "Consoles", difficulty: 4 },
  { templateId: "phone-micro-trace", device: "Smartphone", issue: "Leiterbahn rekonstruieren", diagnostic: "Mikroriss unter Abschirmung", durationSeconds: 58, materialCost: 136, reward: 920, reputationReward: 15, repairXp: 68, requiredReputation: 72, requiredTool: "microscope", skillRequirement: 62, category: "Mobile Devices", difficulty: 5 },
  { templateId: "tablet-precision-board", device: "Tablet", issue: "Board-Schaden mikrolöten", diagnostic: "Korrosion an Feinleiterstruktur", durationSeconds: 64, materialCost: 164, reward: 1_080, reputationReward: 18, repairXp: 78, requiredReputation: 82, requiredTool: "microscope", skillRequirement: 68, category: "Electronics", difficulty: 5 },
];

export const DIFFICULTY_LABELS = ["", "Basic", "Standard", "Advanced", "Professional", "Expert"] as const;

export const DIFFICULTY_BALANCE = {
  1: { duration: 4, reward: 1, material: 1, xp: 1, skill: 0 },
  2: { duration: 4.2, reward: 1.02, material: 1.02, xp: 1.05, skill: 0 },
  3: { duration: 4.4, reward: 1.04, material: 1.04, xp: 1.1, skill: 1 },
  4: { duration: 4.7, reward: 1.07, material: 1.06, xp: 1.15, skill: 2 },
  5: { duration: 5, reward: 1.1, material: 1.08, xp: 1.2, skill: 3 },
} as const;

export const ORDER_VARIANTS = {
  normal: { reward: 1, duration: 1, reputation: 1, skill: 0 },
  urgent: { reward: 1.32, duration: 0.86, reputation: 1.25, skill: 2 },
  premium: { reward: 1.48, duration: 1.12, reputation: 1.45, skill: 5 },
  complex: { reward: 1.22, duration: 1.28, reputation: 1.2, skill: 4 },
} as const;

export const CUSTOMER_NAMES = ["M. Weber", "N. Kaya", "J. Hoffmann", "S. Novak", "A. Fischer", "T. Berger", "L. Nguyen", "C. Winter"];

