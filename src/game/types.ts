export type DeviceKind =
  | "Smartphone"
  | "Controller"
  | "Handheld"
  | "Game Console"
  | "Tablet"
  | "Audio Deck";

export type Urgency = "standard" | "express";
export type ToolId = "basic-kit" | "multimeter" | "soldering-station" | "hot-air-station" | "microscope";
export type UpgradeId = "efficient-workflow" | "better-diagnostics" | "customer-network" | "workshop-organization" | "job-board-expansion";
export type UpgradeLevels = Record<UpgradeId, number>;

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  price: number;
  requiredReputation: number;
  requiredTool?: ToolId;
  unlocks: string[];
}

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  requiredReputation: number;
}

export interface OrderTemplate {
  templateId: string;
  device: DeviceKind;
  issue: string;
  diagnostic: string;
  durationSeconds: number;
  materialCost: number;
  reward: number;
  reputationReward: number;
  repairXp: number;
  requiredReputation: number;
  requiredTool: ToolId;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface RepairOrder extends OrderTemplate {
  id: string;
  customer: string;
  urgency: Urgency;
  createdAt: number;
}

export interface ActiveRepair {
  order: RepairOrder;
  startedAt: number;
  endsAt: number;
  effectiveDurationSeconds: number;
  chargedMaterialCost: number;
}

export interface CompletedRepair {
  id: string;
  device: DeviceKind;
  issue: string;
  reward: number;
  reputationReward: number;
  completedAt: number;
}

export interface GameState {
  saveVersion: number;
  money: number;
  reputation: number;
  repairXp: number;
  ownedTools: ToolId[];
  upgrades: UpgradeLevels;
  availableOrders: RepairOrder[];
  activeRepair: ActiveRepair | null;
  completedRepairs: CompletedRepair[];
  nextOrderNumber: number;
  lastSavedAt: number;
}

export interface ProgressionContext {
  ownedTools: ToolId[];
  reputation: number;
  upgrades: UpgradeLevels;
}

