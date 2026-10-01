import type { BuildingDefinition, BuildingFeatureId, BuildingState, BuildingType, GameState } from "@/game/types";

export const BUILDING_DEFINITIONS: BuildingDefinition[] = [
  { buildingId: "WORKSHOP", name: "Workshop", description: "Produktionskern für Reparaturen und Arbeitsplätze.", maxHandcraftedTier: 5, mapSlot: "production", levels: [
    { level: 1, name: "Startwerkstatt", description: "Kompakter Arbeitsplatz für den Firmenstart.", cost: 0, visualTier: 1, requirements: [], features: { "workstation-capacity": 1, "workshop-grade": 1 }, unlocks: ["Arbeitsplatz 1", "Standardreparaturen"] },
    { level: 2, name: "Erweiterte Werkstatt", description: "Ein zusätzlicher Arbeitsbereich schafft echte Parallelkapazität.", cost: 15_000, visualTier: 2, requirements: [{ type: "companyLevel", value: 60 }, { type: "reputation", value: 30 }], features: { "workstation-capacity": 2, "workshop-grade": 2 }, unlocks: ["Voraussetzung für Arbeitsplatz 2", "Visual Tier 2"] },
    { level: 3, name: "Profiwerkstatt", description: "Strukturierte Hallenplanung für ein wachsendes Team.", cost: 60_000, visualTier: 3, requirements: [{ type: "companyLevel", value: 150 }, { type: "reputation", value: 90 }, { type: "research", value: "management-systems" }], features: { "workstation-capacity": 3, "workshop-grade": 3 }, unlocks: ["Voraussetzung für Arbeitsplatz 3", "Visual Tier 3"] },
    { level: 4, name: "Großwerkstatt", description: "Industrielle Abläufe für vier parallele Reparaturlinien.", cost: 180_000, visualTier: 4, requirements: [{ type: "companyLevel", value: 300 }, { type: "reputation", value: 180 }, { type: "research", value: "advanced-automation" }], features: { "workstation-capacity": 4, "workshop-grade": 4 }, unlocks: ["Voraussetzung für Arbeitsplatz 4", "Visual Tier 4"] },
    { level: 5, name: "High-End Workshop", description: "Die höchste handgefertigte Workshop-Ausbaustufe.", cost: 450_000, visualTier: 5, requirements: [{ type: "companyLevel", value: 500 }, { type: "reputation", value: 260 }, { type: "research", value: "offline-operations" }], features: { "workstation-capacity": 4, "workshop-grade": 5 }, unlocks: ["High-End Werkstattstandard", "Visual Tier 5"] },
  ] },
  { buildingId: "PERSONNEL", name: "Personalzentrum", description: "Kapazität für Techniker und künftige Trainingsfunktionen.", maxHandcraftedTier: 3, mapSlot: "people", levels: [
    { level: 1, name: "Personalbüro", description: "Verwaltet ein kleines Kernteam.", cost: 0, visualTier: 1, requirements: [], features: { "employee-capacity": 2 }, unlocks: ["2 Mitarbeiter"] },
    { level: 2, name: "Teamzentrale", description: "Mehr Platz für wachsende Spezialistenteams.", cost: 9_000, visualTier: 2, requirements: [{ type: "companyLevel", value: 35 }, { type: "reputation", value: 25 }], features: { "employee-capacity": 4 }, unlocks: ["4 Mitarbeiter", "Visual Tier 2"] },
    { level: 3, name: "Talentzentrum", description: "Professionelle Personalstruktur für große Teams.", cost: 42_000, visualTier: 3, requirements: [{ type: "companyLevel", value: 120 }, { type: "reputation", value: 70 }], features: { "employee-capacity": 8 }, unlocks: ["8 Mitarbeiter", "Visual Tier 3"] },
  ] },
  { buildingId: "FINANCE", name: "Finanzbüro", description: "Physische Heimat für Ledger und Unternehmensberichte.", maxHandcraftedTier: 3, mapSlot: "administration", levels: [
    { level: 1, name: "Buchhaltung", description: "Grundlegende Finanzübersicht.", cost: 0, visualTier: 1, requirements: [], features: { "finance-reports": 1 }, unlocks: ["Ledger", "Gesamtbilanz"] },
    { level: 2, name: "Controlling", description: "Erweiterte Analysekapazität für das Unternehmen.", cost: 7_500, visualTier: 2, requirements: [{ type: "companyLevel", value: 25 }], features: { "finance-reports": 2 }, unlocks: ["Erweiterte Reports", "Visual Tier 2"] },
    { level: 3, name: "Finance Center", description: "Vorbereitung für Forecasting und Holdings.", cost: 36_000, visualTier: 3, requirements: [{ type: "companyLevel", value: 100 }, { type: "reputation", value: 60 }], features: { "finance-reports": 3 }, unlocks: ["Business Analytics", "Visual Tier 3"] },
  ] },
  { buildingId: "TOOL_WAREHOUSE", name: "Werkzeuglager", description: "Zugang zu professionellen Equipment-Tiers ohne künstliches Inventarlimit.", maxHandcraftedTier: 3, mapSlot: "equipment", levels: [
    { level: 1, name: "Werkzeugraum", description: "Ausrüstung für Diagnose und Basistechnik.", cost: 0, visualTier: 1, requirements: [], features: { "tool-tier": 2 }, unlocks: ["Basic Kit", "Multimeter"] },
    { level: 2, name: "Profi-Lager", description: "Sichere Infrastruktur für Löt- und Heißlufttechnik.", cost: 12_000, visualTier: 2, requirements: [{ type: "companyLevel", value: 30 }, { type: "reputation", value: 28 }], features: { "tool-tier": 4 }, unlocks: ["Lötstation", "Heißluftstation", "Visual Tier 2"] },
    { level: 3, name: "Präzisionslager", description: "Kalibrierte Lagerung für High-End-Diagnostik.", cost: 55_000, visualTier: 3, requirements: [{ type: "companyLevel", value: 140 }, { type: "reputation", value: 72 }], features: { "tool-tier": 5 }, unlocks: ["Mikroskop", "Visual Tier 3"] },
  ] },
  { buildingId: "RESEARCH", name: "Forschungszentrum", description: "Physische Ausbaustufen für den bestehenden Forschungsbaum.", maxHandcraftedTier: 3, mapSlot: "research", levels: [
    { level: 1, name: "Diagnostiklabor", description: "Grundlagenforschung und Basistechnologien.", cost: 0, visualTier: 1, requirements: [], features: { "research-tier": 1 }, unlocks: ["Research Tier 1"] },
    { level: 2, name: "Entwicklungslabor", description: "Kapazität für fortgeschrittene Reparaturforschung.", cost: 18_000, visualTier: 2, requirements: [{ type: "companyLevel", value: 40 }, { type: "research", value: "basic-diagnostics" }], features: { "research-tier": 2 }, unlocks: ["Research Tier 2", "Visual Tier 2"] },
    { level: 3, name: "Innovationszentrum", description: "Unternehmensweite Automations- und Managementforschung.", cost: 75_000, visualTier: 3, requirements: [{ type: "companyLevel", value: 160 }, { type: "research", value: "management-systems" }], features: { "research-tier": 3 }, unlocks: ["Research Tier 3", "Visual Tier 3"] },
  ] },
  { buildingId: "BUSINESS_OFFICE", name: "Business Office", description: "Kundenbeziehungen, Serienaufträge und Verträge.", maxHandcraftedTier: 3, mapSlot: "business", levels: [
    { level: 1, name: "Kundenbüro", description: "Betreut Kunden und einen aktiven Vertrag.", cost: 0, visualTier: 1, requirements: [], features: { "contract-capacity": 1 }, unlocks: ["Kundenprofile", "1 aktiver Vertrag"] },
    { level: 2, name: "Key Account Office", description: "Eigene Betreuung für zusätzliche Geschäftskunden.", cost: 25_000, visualTier: 2, requirements: [{ type: "companyLevel", value: 60 }, { type: "reputation", value: 45 }], features: { "contract-capacity": 2 }, unlocks: ["+1 Vertragskapazität", "Visual Tier 2"] },
    { level: 3, name: "Business Center", description: "Skalierbare Vertragsbetreuung für Corporate-Kunden.", cost: 95_000, visualTier: 3, requirements: [{ type: "companyLevel", value: 180 }, { type: "reputation", value: 120 }, { type: "research", value: "contract-management" }], features: { "contract-capacity": 3 }, unlocks: ["+1 Vertragskapazität", "Visual Tier 3"] },
  ] },
];

export const BUILDING_TYPES = BUILDING_DEFINITIONS.map((building) => building.buildingId);

export function getBuildingDefinition(buildingId: BuildingType) { return BUILDING_DEFINITIONS.find((building) => building.buildingId === buildingId)!; }
export function getBuildingState(state: Pick<GameState, "buildings">, buildingId: BuildingType) { return state.buildings.find((building) => building.buildingId === buildingId)!; }
export function getBuildingLevelDefinition(buildingId: BuildingType, level: number) { return getBuildingDefinition(buildingId).levels.find((entry) => entry.level === level); }
export function getBuildingFeatureValue(state: Pick<GameState, "buildings">, buildingId: BuildingType, feature: BuildingFeatureId) {
  const building = getBuildingState(state, buildingId);
  return getBuildingLevelDefinition(buildingId, building?.level ?? 1)?.features[feature] ?? 0;
}

export function createInitialBuildings(): BuildingState[] {
  return BUILDING_DEFINITIONS.map((building) => ({ buildingId: building.buildingId, level: 1, unlocked: true, visualTier: building.levels[0].visualTier, upgradeState: "OWNED", cosmeticTheme: null }));
}
