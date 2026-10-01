import { createInitialWorkstations, generateCandidateMarket } from "@/game/data/employees";
import { getReachedMilestones } from "@/game/data/milestones";
import { ORDER_TEMPLATES } from "@/game/data/orders";
import { INITIAL_UPGRADES, SAVE_VERSION, getCompanyLevelProgress } from "@/game/data/progression";
import { createInitialState } from "@/game/logic/game";
import { ensureChallenges } from "@/game/logic/challenges";
import { createDailyStats, createEconomyStats } from "@/game/logic/economy";
import { migrateBuildings } from "@/game/logic/buildings";
import { JOB_BOARD_REFRESH_MS, OFFLINE_CAPACITY_MS, getCurrentTime, getDayKey } from "@/game/logic/time";
import type { ActiveRepair, CompletedRepair, Employee, EmployeeCandidate, GameState, RepairOrder, UpgradeId, Workstation } from "@/game/types";

type LegacySave = Partial<GameState> & { activeRepair?: unknown };

function isBaseSave(value: unknown): value is LegacySave & Pick<GameState, "money" | "reputation" | "availableOrders" | "completedRepairs" | "nextOrderNumber"> {
  if (!value || typeof value !== "object") return false;
  const save = value as Partial<GameState>;
  return typeof save.money === "number" && typeof save.reputation === "number" && Array.isArray(save.availableOrders) && Array.isArray(save.completedRepairs) && typeof save.nextOrderNumber === "number";
}

function migrateOrder(value: unknown): RepairOrder {
  const order = value as Partial<RepairOrder>;
  const template = ORDER_TEMPLATES.find((item) => item.device === order.device && item.issue === order.issue) ?? ORDER_TEMPLATES[0];
  return {
    ...template,
    ...order,
    templateId: order.templateId ?? template.templateId,
    materialCost: order.materialCost ?? template.materialCost,
    repairXp: order.repairXp ?? template.repairXp,
    requiredReputation: order.requiredReputation ?? template.requiredReputation,
    requiredTool: order.requiredTool ?? template.requiredTool,
    skillRequirement: order.skillRequirement ?? template.skillRequirement,
    category: order.category ?? template.category,
    variant: order.variant ?? "normal",
    expiresAt: typeof order.expiresAt === "number" ? order.expiresAt : null,
    customer: order.customer ?? "Werkstattkunde",
    customerId: order.customerId ?? `legacy-${order.id ?? "order"}`,
    customerType: order.customerType ?? "PRIVATE",
    customerRelationship: order.customerRelationship ?? "NEW",
    returningCustomer: order.returningCustomer ?? false,
    multiDeviceOrderId: order.multiDeviceOrderId ?? null,
  } as RepairOrder;
}

function migrateActiveRepair(value: unknown): ActiveRepair | null {
  if (!value || typeof value !== "object") return null;
  const repair = value as Partial<ActiveRepair>;
  if (!repair.order || typeof repair.startedAt !== "number" || typeof repair.endsAt !== "number") return null;
  const order = migrateOrder(repair.order);
  return {
    order,
    startedAt: repair.startedAt,
    endsAt: repair.endsAt,
    effectiveDurationSeconds: repair.effectiveDurationSeconds ?? order.durationSeconds,
    chargedMaterialCost: repair.chargedMaterialCost ?? 0,
    assignedEmployeeId: repair.assignedEmployeeId ?? null,
    speedMultiplier: repair.speedMultiplier ?? 1,
    qualityRating: repair.qualityRating ?? 85,
    specializationBonus: repair.specializationBonus ?? false,
    usedTools: Array.isArray(repair.usedTools) ? repair.usedTools : [order.requiredTool],
  };
}

function migrateWorkstations(value: unknown, legacyRepair: unknown): Workstation[] {
  const now = getCurrentTime();
  const base = createInitialWorkstations();
  if (!Array.isArray(value)) {
    const activeRepair = migrateActiveRepair(legacyRepair);
    return base.map((workstation, index) => index === 0 && activeRepair
      ? { ...workstation, status: now >= activeRepair.endsAt ? "completed" : "repairing", activeRepair }
      : workstation);
  }
  return base.map((fallback, index) => {
    const saved = value[index] as Partial<Workstation> | undefined;
    if (!saved) return fallback;
    const activeRepair = migrateActiveRepair(saved.activeRepair);
    const unlocked = saved.status !== "locked" || index === 0;
    const automationEnabled = Boolean(saved.automationEnabled);
    const assignedEmployeeId = saved.assignedEmployeeId ?? null;
    return {
      ...fallback,
      ...saved,
      status: activeRepair
        ? automationEnabled && assignedEmployeeId
          ? "repairing"
          : now >= activeRepair.endsAt
            ? "completed"
            : "repairing"
        : unlocked ? "available" : "locked",
      activeRepair,
      assignedEmployeeId,
      automationEnabled,
      automationPriority: saved.automationPriority ?? "highest-profit",
    };
  });
}

export function migrateSave(value: unknown): GameState | null {
  if (!isBaseSave(value)) return null;
  const base = createInitialState();
  const upgrades = { ...INITIAL_UPGRADES };
  const savedUpgrades = value.upgrades as Partial<Record<UpgradeId, number>> | undefined;
  (Object.keys(upgrades) as UpgradeId[]).forEach((id) => {
    const level = savedUpgrades?.[id];
    if (typeof level === "number") upgrades[id] = Math.max(0, Math.min(5, Math.floor(level)));
  });
  const employees = Array.isArray(value.employees) ? (value.employees as Employee[]).map((employee) => ({
    ...employee,
    repairsCompleted: Number.isFinite(employee.repairsCompleted) ? employee.repairsCompleted : 0,
    revenueGenerated: Number.isFinite(employee.revenueGenerated) ? employee.revenueGenerated : 0,
  })) : [];
  const candidates = Array.isArray(value.candidates)
    ? value.candidates as EmployeeCandidate[]
    : generateCandidateMarket(1, value.reputation);
  const workstations = migrateWorkstations(value.workstations, value.activeRepair);

  const now = getCurrentTime();
  const savedStats = value.lifetimeStats;
  const baseStats = createEconomyStats();
  const lifetimeStats = savedStats && typeof savedStats === "object"
    ? { ...baseStats, ...savedStats, categoryProfit: { ...baseStats.categoryProfit, ...savedStats.categoryProfit } }
    : baseStats;
  const completedRepairs = value.completedRepairs.map((repair) => {
    const legacy = repair as Partial<CompletedRepair>;
    const template = ORDER_TEMPLATES.find((item) => item.device === legacy.device && item.issue === legacy.issue) ?? ORDER_TEMPLATES[0];
    const materialCost = legacy.materialCost ?? template.materialCost;
    const operatingCost = legacy.operatingCost ?? 0;
    return { ...legacy, materialCost, operatingCost, profit: legacy.profit ?? (legacy.reward ?? template.reward) - materialCost - operatingCost, category: legacy.category ?? template.category, source: legacy.source ?? "manual" } as CompletedRepair;
  });
  const lastSavedAt = Number.isFinite(value.lastSavedAt) ? Math.min(value.lastSavedAt!, now) : now;
  const lastActiveAt = Number.isFinite(value.lastActiveAt) ? Math.min(value.lastActiveAt!, now) : lastSavedAt;
  const lifetimeXp = Number.isFinite(value.lifetimeXp) ? Math.max(0, value.lifetimeXp!) : Math.max(0, value.repairXp ?? value.completedRepairs.length * 12);
  const companyProgress = getCompanyLevelProgress(lifetimeXp);
  const milestones = Array.isArray(value.milestones)
    ? value.milestones
    : getReachedMilestones(1, companyProgress.level).map((milestone) => ({ id: milestone.id, completedAt: now, claimed: false }));

  const migrated: GameState = {
    ...base,
    ...value,
    saveVersion: SAVE_VERSION,
    identity: {
      ...base.identity,
      ...(value.identity ?? {}),
      cosmetics: { ...base.identity.cosmetics, ...(value.identity?.cosmetics ?? {}) },
    },
    repairXp: lifetimeXp,
    companyLevel: companyProgress.level,
    currentLevelXp: companyProgress.current,
    lifetimeXp,
    researchPoints: Number.isFinite(value.researchPoints) ? Math.max(0, value.researchPoints!) : 0,
    researchedNodes: Array.isArray(value.researchedNodes) ? value.researchedNodes : [],
    milestones,
    pendingMilestoneId: typeof value.pendingMilestoneId === "string" ? value.pendingMilestoneId : milestones.find((milestone) => !milestone.claimed)?.id ?? null,
    activeChallenges: Array.isArray(value.activeChallenges) ? value.activeChallenges : [],
    dailyChallenges: Array.isArray(value.dailyChallenges) ? value.dailyChallenges : [],
    completedChallenges: Number.isFinite(value.completedChallenges) ? Math.max(0, value.completedChallenges!) : 0,
    nextChallengeSeed: Number.isFinite(value.nextChallengeSeed) ? Math.max(1, value.nextChallengeSeed!) : 1,
    dailyChallengeDayKey: typeof value.dailyChallengeDayKey === "string" ? value.dailyChallengeDayKey : getDayKey(now),
    ownedTools: Array.isArray(value.ownedTools) && value.ownedTools.length > 0 ? value.ownedTools : ["basic-kit"],
    upgrades,
    availableOrders: value.availableOrders.map(migrateOrder),
    workstations,
    employees,
    candidates,
    nextCandidateNumber: typeof value.nextCandidateNumber === "number" ? value.nextCandidateNumber : candidates.length + 1,
    completedRepairs,
    nextBoardRefreshAt: Number.isFinite(value.nextBoardRefreshAt) ? value.nextBoardRefreshAt! : now + JOB_BOARD_REFRESH_MS,
    offlineCapacityMs: Number.isFinite(value.offlineCapacityMs) ? Math.max(0, Math.min(value.offlineCapacityMs!, 24 * 60 * 60 * 1000)) : OFFLINE_CAPACITY_MS,
    lastSavedAt,
    lastActiveAt,
    lifetimeStats,
    dailyStats: value.dailyStats && typeof value.dailyStats === "object" ? { ...createDailyStats(now), ...value.dailyStats } : createDailyStats(now),
    transactions: Array.isArray(value.transactions) ? value.transactions.slice(0, 80) : [],
    recentCustomers: Array.isArray(value.recentCustomers) ? value.recentCustomers.slice(0, 18) : [],
    persistentCustomers: Array.isArray(value.persistentCustomers) ? value.persistentCustomers : [],
    multiDeviceOrders: Array.isArray(value.multiDeviceOrders) ? value.multiDeviceOrders : [],
    contractOffers: Array.isArray(value.contractOffers) ? value.contractOffers : [],
    contracts: Array.isArray(value.contracts) ? value.contracts : [],
    nextCustomerNumber: Number.isFinite(value.nextCustomerNumber) ? Math.max(1, value.nextCustomerNumber!) : base.nextCustomerNumber,
    nextMultiDeviceNumber: Number.isFinite(value.nextMultiDeviceNumber) ? Math.max(1, value.nextMultiDeviceNumber!) : 1,
    nextContractNumber: Number.isFinite(value.nextContractNumber) ? Math.max(1, value.nextContractNumber!) : 1,
    buildings: migrateBuildings(value.buildings, { workstations, employees, ownedTools: Array.isArray(value.ownedTools) && value.ownedTools.length > 0 ? value.ownedTools : ["basic-kit"], researchedNodes: Array.isArray(value.researchedNodes) ? value.researchedNodes : [], contracts: Array.isArray(value.contracts) ? value.contracts : [] }),
    lastBuildingUpgrade: value.lastBuildingUpgrade && typeof value.lastBuildingUpgrade === "object" ? value.lastBuildingUpgrade : null,
  };
  return ensureChallenges(migrated, now, getDayKey(now));
}

