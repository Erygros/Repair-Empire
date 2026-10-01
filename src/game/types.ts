export type DeviceKind =
  | "Smartphone"
  | "Controller"
  | "Handheld"
  | "Game Console"
  | "Tablet"
  | "Laptop"
  | "Audio Deck";

export type Urgency = "standard" | "express";
export type OrderVariant = "normal" | "urgent" | "premium" | "complex";
export type RepairSource = "manual" | "automated" | "offline";
export type TransactionType = "REPAIR_REWARD" | "MATERIAL_COST" | "OPERATING_COST" | "TOOL_PURCHASE" | "UPGRADE_PURCHASE" | "EMPLOYEE_HIRE" | "WORKSTATION_PURCHASE" | "MARKET_REFRESH" | "CHALLENGE_REWARD" | "MILESTONE_REWARD";
export type ToolId = "basic-kit" | "multimeter" | "soldering-station" | "hot-air-station" | "microscope";
export type UpgradeId = "efficient-workflow" | "better-diagnostics" | "customer-network" | "workshop-organization" | "job-board-expansion";
export type UpgradeLevels = Record<UpgradeId, number>;
export type RepairCategory = "Mobile Devices" | "Consoles" | "Computers" | "Electronics";
export type EmployeeClass = "Apprentice" | "Junior Technician" | "Technician" | "Senior Technician" | "Specialist";
export type AutomationPriority = "highest-profit" | "fastest-jobs" | "reputation" | "specialization";
export type WorkstationStatus = "locked" | "available" | "repairing" | "completed";
export type ResearchId = "basic-diagnostics" | "advanced-diagnostics" | "job-analysis" | "material-efficiency" | "advanced-repair" | "specialized-repair" | "management-systems" | "advanced-automation" | "offline-operations";
export type ResearchCategory = "Diagnostics" | "Repair Technology" | "Management" | "Automation";
export type ChallengeCategory = "repair" | "profit" | "reputation" | "specialist" | "automation" | "difficulty" | "urgent";

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
  variant: OrderVariant;
  createdAt: number;
  expiresAt: number | null;
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
  repairsCompleted: number;
  revenueGenerated: number;
}

export interface Workstation {
  id: string;
  index: number;
  status: WorkstationStatus;
  purchasePrice: number;
  requiredReputation: number;
  requiredLevel: number;
  assignedEmployeeId: string | null;
  activeRepair: ActiveRepair | null;
  automationEnabled: boolean;
  automationPriority: AutomationPriority;
}

export interface OfflineSummary {
  durationMs: number;
  productiveDurationMs: number;
  capacityReached: boolean;
  completedRepairs: number;
  revenue: number;
  materialCosts: number;
  operatingCosts: number;
  profit: number;
  reputation: number;
  employeeXp: number;
  levelUps: string[];
  companyLevelsGained: number;
  researchPointsGained: number;
}

export interface MilestoneState {
  id: string;
  completedAt: number;
  claimed: boolean;
}

export interface ChallengeReward {
  money: number;
  xp: number;
  reputation: number;
  researchPoints: number;
}

export interface Challenge {
  id: string;
  seed: number;
  category: ChallengeCategory;
  title: string;
  description: string;
  target: number;
  progress: number;
  targetCategory?: RepairCategory;
  targetDifficulty?: number;
  reward: ChallengeReward;
  createdAt: number;
  completed: boolean;
  claimed: boolean;
  daily: boolean;
}

export interface CompletedRepair {
  id: string;
  device: DeviceKind;
  issue: string;
  reward: number;
  materialCost: number;
  operatingCost: number;
  profit: number;
  category: RepairCategory;
  source: RepairSource;
  reputationReward: number;
  completedAt: number;
}

export interface EconomyStats {
  totalRevenue: number;
  totalMaterialCosts: number;
  totalOperatingCosts: number;
  totalProfit: number;
  repairsCompleted: number;
  manualRepairs: number;
  automatedRepairs: number;
  offlineRepairs: number;
  moneySpentOnTools: number;
  moneySpentOnUpgrades: number;
  moneySpentOnEmployees: number;
  moneySpentOnWorkstations: number;
  highestSingleRepairProfit: number;
  totalReputationEarned: number;
  categoryProfit: Record<RepairCategory, number>;
}

export interface DailyStats {
  dayKey: string;
  revenue: number;
  materialCosts: number;
  operatingCosts: number;
  profit: number;
  repairsCompleted: number;
}

export interface EconomyTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  createdAt: number;
  reference: string;
}

export interface IdentityState {
  accountId: string;
  companyId: string;
  companyName: string;
  characterId: string;
  cosmetics: {
    outfit: string | null;
    headwear: string | null;
    accessory: string | null;
    workwear: string | null;
    characterSkin: string | null;
    workstationSkin: string | null;
    buildingSkin: string | null;
  };
}

export interface GameState {
  saveVersion: number;
  identity: IdentityState;
  money: number;
  reputation: number;
  repairXp: number;
  companyLevel: number;
  currentLevelXp: number;
  lifetimeXp: number;
  researchPoints: number;
  researchedNodes: ResearchId[];
  milestones: MilestoneState[];
  pendingMilestoneId: string | null;
  activeChallenges: Challenge[];
  dailyChallenges: Challenge[];
  completedChallenges: number;
  nextChallengeSeed: number;
  dailyChallengeDayKey: string;
  ownedTools: ToolId[];
  upgrades: UpgradeLevels;
  availableOrders: RepairOrder[];
  workstations: Workstation[];
  employees: Employee[];
  candidates: EmployeeCandidate[];
  nextCandidateNumber: number;
  completedRepairs: CompletedRepair[];
  nextOrderNumber: number;
  nextBoardRefreshAt: number;
  offlineCapacityMs: number;
  lastActiveAt: number;
  lastSavedAt: number;
  lifetimeStats: EconomyStats;
  dailyStats: DailyStats;
  transactions: EconomyTransaction[];
}

export interface ProgressionContext {
  ownedTools: ToolId[];
  reputation: number;
  upgrades: UpgradeLevels;
  companyLevel: number;
  researchedNodes: ResearchId[];
}

