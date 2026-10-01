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
export type TransactionType = "REPAIR_REWARD" | "MATERIAL_COST" | "OPERATING_COST" | "TOOL_PURCHASE" | "UPGRADE_PURCHASE" | "EMPLOYEE_HIRE" | "WORKSTATION_PURCHASE" | "MARKET_REFRESH" | "CHALLENGE_REWARD" | "MILESTONE_REWARD" | "CONTRACT_REWARD" | "BUILDING_UPGRADE";
export type ToolId = "basic-kit" | "multimeter" | "soldering-station" | "hot-air-station" | "microscope";
export type UpgradeId = "efficient-workflow" | "better-diagnostics" | "customer-network" | "workshop-organization" | "job-board-expansion";
export type UpgradeLevels = Record<UpgradeId, number>;
export type RepairCategory = "Mobile Devices" | "Consoles" | "Computers" | "Electronics";
export type EmployeeClass = "Apprentice" | "Junior Technician" | "Technician" | "Senior Technician" | "Specialist";
export type AutomationPriority = "highest-profit" | "fastest-jobs" | "reputation" | "specialization";
export type WorkstationStatus = "locked" | "available" | "repairing" | "completed";
export type ResearchId = "basic-diagnostics" | "advanced-diagnostics" | "job-analysis" | "material-efficiency" | "advanced-repair" | "specialized-repair" | "management-systems" | "contract-management" | "advanced-automation" | "offline-operations";
export type ResearchCategory = "Diagnostics" | "Repair Technology" | "Management" | "Automation";
export type ChallengeCategory = "repair" | "profit" | "reputation" | "specialist" | "automation" | "difficulty" | "urgent";
export type CustomerType = "PRIVATE" | "GAMER" | "SMALL_BUSINESS" | "RETAILER" | "CORPORATE" | "PREMIUM";
export type RelationshipState = "NEW" | "KNOWN" | "REGULAR" | "TRUSTED" | "PARTNER";
export type MultiDeviceStatus = "active" | "completed" | "expired";
export type ContractType = "SERVICE" | "BULK_REPAIR" | "SPECIALIZED_SERVICE" | "PRIORITY_SERVICE";
export type ContractStatus = "offered" | "active" | "completed" | "failed" | "claimed";
export type BuildingType = "WORKSHOP" | "PERSONNEL" | "FINANCE" | "TOOL_WAREHOUSE" | "RESEARCH" | "BUSINESS_OFFICE";
export type BuildingStatus = "LOCKED" | "AVAILABLE" | "OWNED" | "UPGRADE_AVAILABLE";
export type BuildingFeatureId = "workstation-capacity" | "employee-capacity" | "tool-tier" | "research-tier" | "contract-capacity" | "finance-reports" | "workshop-grade";
export type BuildingRequirement =
  | { type: "companyLevel"; value: number }
  | { type: "reputation"; value: number }
  | { type: "research"; value: ResearchId }
  | { type: "buildingLevel"; buildingId: BuildingType; value: number };

export interface BuildingLevelDefinition {
  level: number;
  name: string;
  description: string;
  cost: number;
  visualTier: number;
  requirements: BuildingRequirement[];
  features: Partial<Record<BuildingFeatureId, number>>;
  unlocks: string[];
}

export interface BuildingDefinition {
  buildingId: BuildingType;
  name: string;
  description: string;
  maxHandcraftedTier: number;
  mapSlot: string;
  levels: BuildingLevelDefinition[];
}

export interface BuildingState {
  buildingId: BuildingType;
  level: number;
  unlocked: boolean;
  visualTier: number;
  upgradeState: BuildingStatus;
  cosmeticTheme: string | null;
}

export interface BuildingUpgradeEvent {
  buildingId: BuildingType;
  oldLevel: number;
  newLevel: number;
  oldVisualTier: number;
  newVisualTier: number;
  unlockedFeatures: string[];
  createdAt: number;
}

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
  customerId: string;
  customerType: CustomerType;
  customerRelationship: RelationshipState;
  returningCustomer: boolean;
  multiDeviceOrderId: string | null;
  urgency: Urgency;
  variant: OrderVariant;
  createdAt: number;
  expiresAt: number | null;
}

export interface Customer {
  id: string;
  displayName: string;
  customerType: CustomerType;
  preferredDeviceCategories: RepairCategory[];
  loyalty: number;
  relationshipState: RelationshipState;
  totalJobs: number;
  successfulJobs: number;
  totalRevenueGenerated: number;
  firstSeenAt: number;
  lastSeenAt: number;
  isPersistent: boolean;
  activeContractId: string | null;
  recentRepairs: { device: DeviceKind; completedAt: number }[];
}

export interface MultiDeviceOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  items: string[];
  totalItems: number;
  completedItems: number;
  totalRevenue: number;
  estimatedTotalMaterialCost: number;
  status: MultiDeviceStatus;
  createdAt: number;
  expiresAt: number | null;
}

export interface ContractReward {
  money: number;
  xp: number;
  reputation: number;
  researchPoints: number;
  loyalty: number;
}

export interface Contract {
  id: string;
  customerId: string;
  customerName: string;
  type: ContractType;
  title: string;
  description: string;
  target: number;
  progress: number;
  targetCategory: RepairCategory | null;
  requiresUrgent: boolean;
  reward: ContractReward;
  status: ContractStatus;
  createdAt: number;
  acceptedAt: number | null;
  expiresAt: number | null;
  completedAt: number | null;
  rewardedAt: number | null;
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
  customersServed: number;
  returningCustomers: number;
  multiDeviceOrdersCompleted: number;
  contractsAccepted: number;
  contractsCompleted: number;
  contractsFailed: number;
  contractRevenue: number;
  highestContractBonus: number;
  buildingsOwned: number;
  buildingUpgradesPurchased: number;
  moneyInvestedInBuildings: number;
  highestWorkshopLevel: number;
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
  recentCustomers: Customer[];
  persistentCustomers: Customer[];
  multiDeviceOrders: MultiDeviceOrder[];
  contractOffers: Contract[];
  contracts: Contract[];
  nextCustomerNumber: number;
  nextMultiDeviceNumber: number;
  nextContractNumber: number;
  buildings: BuildingState[];
  lastBuildingUpgrade: BuildingUpgradeEvent | null;
}

export interface ProgressionContext {
  ownedTools: ToolId[];
  reputation: number;
  upgrades: UpgradeLevels;
  companyLevel: number;
  researchedNodes: ResearchId[];
}

