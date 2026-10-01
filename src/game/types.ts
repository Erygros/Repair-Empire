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
export type RepairCategory = "Mobile Devices" | "Consoles" | "Computers" | "Electronics";
export type EmployeeClass = "Apprentice" | "Junior Technician" | "Technician" | "Senior Technician" | "Specialist";
export type AutomationPriority = "highest-profit" | "fastest-jobs" | "reputation" | "specialization";
export type WorkstationStatus = "locked" | "available" | "repairing" | "completed";

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
  skillRequirement: number;
  category: RepairCategory;
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
  assignedEmployeeId: string | null;
  speedMultiplier: number;
  qualityRating: number;
  specializationBonus: boolean;
  usedTools: ToolId[];
}

export interface EmployeeCandidate {
  id: string;
  name: string;
  class: EmployeeClass;
  hiringCost: number;
  speed: number;
  skill: number;
  quality: number;
  specialization: RepairCategory;
}

export interface Employee extends EmployeeCandidate {
  xp: number;
  level: number;
  assignedWorkstationId: string | null;
}

export interface Workstation {
  id: string;
  index: number;
  status: WorkstationStatus;
  purchasePrice: number;
  requiredReputation: number;
  assignedEmployeeId: string | null;
  activeRepair: ActiveRepair | null;
  automationEnabled: boolean;
  automationPriority: AutomationPriority;
}

export interface OfflineSummary {
  durationMs: number;
  completedRepairs: number;
  earnings: number;
  reputation: number;
  employeeXp: number;
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
  workstations: Workstation[];
  employees: Employee[];
  candidates: EmployeeCandidate[];
  nextCandidateNumber: number;
  completedRepairs: CompletedRepair[];
  nextOrderNumber: number;
  lastSavedAt: number;
}

export interface ProgressionContext {
  ownedTools: ToolId[];
  reputation: number;
  upgrades: UpgradeLevels;
}

