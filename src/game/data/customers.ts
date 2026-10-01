import type { CustomerType, RelationshipState, RepairCategory } from "@/game/types";

export const CUSTOMER_TYPE_CONFIG: Record<CustomerType, {
  label: string;
  preferences: RepairCategory[];
  minLevel: number;
  minReputation: number;
  urgencyBias: number;
  multiDeviceMin: number;
  contractEligible: boolean;
}> = {
  PRIVATE: { label: "Privat", preferences: ["Mobile Devices", "Computers", "Electronics"], minLevel: 1, minReputation: 0, urgencyBias: 0.1, multiDeviceMin: 0, contractEligible: false },
  GAMER: { label: "Gaming", preferences: ["Consoles", "Mobile Devices", "Computers"], minLevel: 1, minReputation: 5, urgencyBias: 0.3, multiDeviceMin: 0, contractEligible: false },
  SMALL_BUSINESS: { label: "Kleinbetrieb", preferences: ["Computers", "Electronics", "Mobile Devices"], minLevel: 15, minReputation: 20, urgencyBias: 0.15, multiDeviceMin: 2, contractEligible: true },
  RETAILER: { label: "Händler", preferences: ["Consoles", "Mobile Devices", "Electronics"], minLevel: 35, minReputation: 45, urgencyBias: 0.18, multiDeviceMin: 3, contractEligible: true },
  CORPORATE: { label: "Corporate", preferences: ["Computers", "Electronics"], minLevel: 150, minReputation: 120, urgencyBias: 0.2, multiDeviceMin: 4, contractEligible: true },
  PREMIUM: { label: "Premium", preferences: ["Mobile Devices", "Computers", "Electronics", "Consoles"], minLevel: 80, minReputation: 70, urgencyBias: 0.28, multiDeviceMin: 0, contractEligible: true },
};

export const RELATIONSHIP_THRESHOLDS: { state: RelationshipState; loyalty: number }[] = [
  { state: "PARTNER", loyalty: 85 },
  { state: "TRUSTED", loyalty: 60 },
  { state: "REGULAR", loyalty: 35 },
  { state: "KNOWN", loyalty: 15 },
  { state: "NEW", loyalty: 0 },
];

export const PRIVATE_FIRST_NAMES = ["Aylin", "Mara", "Jonas", "Leonie", "Tariq", "Noah", "Sofia", "Milan", "Elif", "Theo", "Nora", "Samira"];
export const PRIVATE_LAST_NAMES = ["Berger", "Winter", "Kaya", "Hoffmann", "Nguyen", "Fischer", "Novak", "Weber", "Lorenz", "Aydin", "Brandt", "Vogel"];
export const BUSINESS_PREFIXES = ["Nordwerk", "PixelPoint", "RheinTech", "Nova", "Kernblick", "Hafenlicht", "Westfeld", "Signalraum", "Morgenstern", "Brückenwerk"];
export const BUSINESS_SUFFIXES = ["Solutions", "Systems", "Office", "Retail", "Service", "Handel", "Technik", "Logistik"];

export const BASE_ACTIVE_CONTRACT_LIMIT = 1;
export const RECENT_CUSTOMER_LIMIT = 18;

