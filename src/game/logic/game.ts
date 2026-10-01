import { DIFFICULTY_BALANCE, ORDER_TEMPLATES, ORDER_VARIANTS } from "@/game/data/orders";
import { EMPLOYEE_XP_THRESHOLDS, createInitialWorkstations, generateCandidateMarket, getEmployeeOperatingCost } from "@/game/data/employees";
import { INITIAL_UPGRADES, SAVE_VERSION, getCompanyLevelProgress, getUpgrade } from "@/game/data/progression";
import { applyChallengeEvent, ensureChallenges } from "@/game/logic/challenges";
import { applyTransaction, createDailyStats, createEconomyStats, recordRepairEconomy } from "@/game/logic/economy";
import { awardCompanyXp } from "@/game/logic/progression";
import { chooseCustomer, generateCustomer, preferredTemplates, recordCustomerRepair } from "@/game/logic/customers";
import { expireContracts, maybeCreateContractOffer, recordContractProgress } from "@/game/logic/contracts";
import { CUSTOMER_TYPE_CONFIG } from "@/game/data/customers";
import { JOB_BOARD_REFRESH_MS, OFFLINE_CAPACITY_MS, URGENT_JOB_LIFETIME_MS, getCurrentTime, getDayKey, getOfflineWindow } from "@/game/logic/time";
import type { ActiveRepair, Customer, Employee, GameState, OfflineSummary, OrderVariant, ProgressionContext, RepairOrder, RepairSource, ToolId, UpgradeId, UpgradeLevels, Workstation } from "@/game/types";

const INITIAL_ORDER_COUNT = 5;

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.floor(seededUnit(seed) * items.length) % items.length];
}

export function canAccessOrder(order: RepairOrder, context: ProgressionContext) {
  return context.ownedTools.includes(order.requiredTool) && context.reputation >= order.requiredReputation;
}

function getTemplatePool(context: ProgressionContext, preference: "accessible" | "locked" | "mixed") {
  const accessible = ORDER_TEMPLATES.filter(
    (template) => context.ownedTools.includes(template.requiredTool) && context.reputation >= template.requiredReputation,
  );
  const locked = ORDER_TEMPLATES.filter(
    (template) => !context.ownedTools.includes(template.requiredTool) || context.reputation < template.requiredReputation,
  );

  if (preference === "locked" && locked.length > 0) return locked;
  if (preference === "accessible" || locked.length === 0) return accessible.length > 0 ? accessible : ORDER_TEMPLATES;
  return accessible.length > 0 ? accessible : locked;
}

function getOrderVariant(orderNumber: number, context: ProgressionContext, customer: Customer): OrderVariant {
  const roll = seededUnit(orderNumber * 7);
  if (customer.customerType === "PREMIUM" && roll > 0.62) return "premium";
  if ((context.reputation >= 45 || context.researchedNodes.includes("advanced-repair")) && roll > 0.9) return "premium";
  if (roll > 0.84 - CUSTOMER_TYPE_CONFIG[customer.customerType].urgencyBias) return "urgent";
  if (["CORPORATE", "RETAILER"].includes(customer.customerType) && roll > 0.48) return "complex";
  if (roll > 0.58) return "complex";
  return "normal";
}

export function createOrder(
  orderNumber: number,
  context: ProgressionContext,
  now = getCurrentTime(),
  preference: "accessible" | "locked" | "mixed" = "mixed",
  customer?: Customer,
  returningCustomer = false,
  multiDeviceOrderId: string | null = null,
): RepairOrder {
  const generatedCustomer = customer ?? generateCustomer(orderNumber, context, now);
  const pool = preferredTemplates(getTemplatePool(context, preference), generatedCustomer);
  const networkLevel = context.upgrades["customer-network"];
  const weightedPool = pool.flatMap((template) =>
    Array.from({ length: 1 + Math.max(0, template.difficulty - 1) * networkLevel }, () => template),
  );
  const template = pick(weightedPool, orderNumber * 3);
  const variant = getOrderVariant(orderNumber, context, generatedCustomer);
  const modifiers = ORDER_VARIANTS[variant];
  const difficulty = DIFFICULTY_BALANCE[template.difficulty];
  const urgency = variant === "urgent" ? "express" : "standard";
  const rewardMultiplier = 1 + networkLevel * 0.05 + context.upgrades["workshop-organization"] * 0.03;
  const materialMultiplier = (1 - context.upgrades["better-diagnostics"] * 0.06) * (context.researchedNodes.includes("material-efficiency") ? 0.92 : 1);

  return {
    ...template,
    id: `RE-${String(orderNumber).padStart(4, "0")}`,
    customer: generatedCustomer.displayName,
    customerId: generatedCustomer.id,
    customerType: generatedCustomer.customerType,
    customerRelationship: generatedCustomer.relationshipState,
    returningCustomer,
    multiDeviceOrderId,
    urgency,
    variant,
    durationSeconds: Math.max(30, Math.round(template.durationSeconds * difficulty.duration * modifiers.duration)),
    reward: Math.round(template.reward * difficulty.reward * modifiers.reward * rewardMultiplier),
    materialCost: Math.max(1, Math.round(template.materialCost * difficulty.material * materialMultiplier)),
    reputationReward: Math.max(1, Math.round(template.reputationReward * modifiers.reputation)),
    repairXp: Math.round(template.repairXp * difficulty.xp),
    skillRequirement: template.skillRequirement + difficulty.skill + modifiers.skill,
    createdAt: now,
    expiresAt: variant === "urgent" ? now + URGENT_JOB_LIFETIME_MS : null,
  };
}

export function getBoardSize(upgrades: UpgradeLevels, researchedNodes: GameState["researchedNodes"] = []) {
  return INITIAL_ORDER_COUNT + upgrades["job-board-expansion"] + (researchedNodes.includes("management-systems") ? 1 : 0);
}

export function createOrderBoard(
  count: number,
  firstOrderNumber: number,
  context: ProgressionContext,
  now = getCurrentTime(),
) {
  const hasLockedTemplates = ORDER_TEMPLATES.some(
    (template) => !context.ownedTools.includes(template.requiredTool) || context.reputation < template.requiredReputation,
  );
  return Array.from({ length: count }, (_, index) =>
    createOrder(
      firstOrderNumber + index,
      context,
      now + index,
      hasLockedTemplates && index === count - 1 ? "locked" : "accessible",
    ),
  );
}

export function fillOrderBoard(state: GameState, context: ProgressionContext, now = getCurrentTime()) {
  const missing = Math.max(0, getBoardSize(context.upgrades, context.researchedNodes) - state.availableOrders.length);
  let nextCustomerNumber = state.nextCustomerNumber;
  const additions = Array.from({ length: missing }, (_, index) => {
    const selection = chooseCustomer({ ...state, nextCustomerNumber }, state.nextOrderNumber + index, now + index);
    if (!selection.returning) nextCustomerNumber += 1;
    return createOrder(state.nextOrderNumber + index, context, now + index, "mixed", selection.customer, selection.returning);
  });
  return {
    orders: [...state.availableOrders, ...additions],
    nextOrderNumber: state.nextOrderNumber + missing,
    nextCustomerNumber,
  };
}

export function refreshOrderBoard(state: GameState, now = getCurrentTime()) {
  const activeOrderIds = new Set(state.workstations.flatMap((station) => station.activeRepair ? [station.activeRepair.order.id] : []));
  const availableOrders = state.availableOrders.filter((order) => !order.expiresAt || order.expiresAt > now || activeOrderIds.has(order.id));
  if (availableOrders.length === state.availableOrders.length && availableOrders.length >= getBoardSize(state.upgrades, state.researchedNodes) && now < state.nextBoardRefreshAt) return state;
  const partial = { ...state, availableOrders };
  const filled = fillOrderBoard(partial, getProgressionContext(partial), now);
  return { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber, nextCustomerNumber: filled.nextCustomerNumber, nextBoardRefreshAt: now + JOB_BOARD_REFRESH_MS };
}

export function createMultiDeviceOrder(state: GameState, customerId: string, now = getCurrentTime()) {
  const customer = state.persistentCustomers.find((item) => item.id === customerId);
  if (!customer) return { state, error: "Kunde nicht gefunden" };
  if (!["SMALL_BUSINESS", "RETAILER", "CORPORATE"].includes(customer.customerType)) return { state, error: "Dieser Kundentyp vergibt keine Serienaufträge" };
  if (state.multiDeviceOrders.some((order) => order.customerId === customerId && order.status === "active")) return { state, error: "Für diesen Kunden läuft bereits ein Mehrgeräte-Auftrag" };
  const capacity = state.workstations.filter((station) => station.status !== "locked").length;
  const count = Math.max(2, Math.min(6, capacity + (customer.customerType === "CORPORATE" ? 2 : 1)));
  const orderId = `MD-${String(state.nextMultiDeviceNumber).padStart(4, "0")}`;
  const items = Array.from({ length: count }, (_, index) => createOrder(state.nextOrderNumber + index, getProgressionContext(state), now + index, "accessible", customer, true, orderId));
  return {
    state: {
      ...state,
      availableOrders: [...items, ...state.availableOrders],
      multiDeviceOrders: [{ orderId, customerId, customerName: customer.displayName, items: items.map((item) => item.id), totalItems: count, completedItems: 0, totalRevenue: items.reduce((sum, item) => sum + item.reward, 0), estimatedTotalMaterialCost: items.reduce((sum, item) => sum + item.materialCost, 0), status: "active" as const, createdAt: now, expiresAt: now + 24 * 60 * 60 * 1000 }, ...state.multiDeviceOrders].slice(0, 20),
      nextOrderNumber: state.nextOrderNumber + count,
      nextMultiDeviceNumber: state.nextMultiDeviceNumber + 1,
    },
    error: null,
  };
}

export function getJobEconomy(order: RepairOrder, upgrades: UpgradeLevels, speed = 1, specializationBonus = false, operatingCost = 0) {
  const durationSeconds = getWorkstationDuration(order, upgrades, speed, specializationBonus);
  const estimatedProfit = order.reward - order.materialCost - operatingCost;
  return { revenue: order.reward, materialCost: order.materialCost, operatingCost, estimatedProfit, durationSeconds, profitPerMinute: estimatedProfit / Math.max(1, durationSeconds / 60) };
}

export function getEffectiveDuration(durationSeconds: number, upgrades: UpgradeLevels) {
  const reduction = upgrades["efficient-workflow"] * 0.06 + upgrades["workshop-organization"] * 0.03;
  return Math.max(5, Math.round(durationSeconds * Math.max(0.55, 1 - reduction)));
}

export function getUpgradeCost(upgradeId: UpgradeId, currentLevel: number) {
  const upgrade = getUpgrade(upgradeId);
  return Math.round(upgrade.baseCost * upgrade.costGrowth ** currentLevel / 10) * 10;
}

export function getUpgradeEffect(upgradeId: UpgradeId, level: number) {
  switch (upgradeId) {
    case "efficient-workflow": return `${level * 6}% kürzere Reparaturen`;
    case "better-diagnostics": return `${level * 6}% weniger Materialkosten`;
    case "customer-network": return `${level * 5}% bessere Basisvergütung`;
    case "workshop-organization": return `${level * 3}% Tempo und Vergütung`;
    case "job-board-expansion": return `${INITIAL_ORDER_COUNT + level} Aufträge gleichzeitig`;
  }
}

export function getRepairLevel(repairXp: number) {
  return getCompanyLevelProgress(repairXp).level;
}

export function getRepairLevelProgress(repairXp: number) {
  return getCompanyLevelProgress(repairXp);
}

export function getProgressionContext(state: Pick<GameState, "ownedTools" | "reputation" | "upgrades" | "companyLevel" | "researchedNodes">): ProgressionContext {
  return { ownedTools: state.ownedTools, reputation: state.reputation, upgrades: state.upgrades, companyLevel: state.companyLevel, researchedNodes: state.researchedNodes };
}

export function createInitialState(): GameState {
  const now = getCurrentTime();
  const context: ProgressionContext = { ownedTools: ["basic-kit"], reputation: 10, upgrades: { ...INITIAL_UPGRADES }, companyLevel: 1, researchedNodes: [] };
  const availableOrders = createOrderBoard(INITIAL_ORDER_COUNT, 1, context, now);
  const initial: GameState = {
    saveVersion: SAVE_VERSION,
    identity: {
      accountId: "local-account",
      companyId: "company-001",
      companyName: "Repair Empire",
      characterId: "character-001",
      cosmetics: { outfit: null, headwear: null, accessory: null, workwear: null, characterSkin: null, workstationSkin: null, buildingSkin: null },
    },
    money: 500,
    reputation: 10,
    repairXp: 0,
    companyLevel: 1,
    currentLevelXp: 0,
    lifetimeXp: 0,
    researchPoints: 0,
    researchedNodes: [],
    milestones: [],
    pendingMilestoneId: null,
    activeChallenges: [],
    dailyChallenges: [],
    completedChallenges: 0,
    nextChallengeSeed: 1,
    dailyChallengeDayKey: createDailyStats(now).dayKey,
    ownedTools: ["basic-kit"],
    upgrades: { ...INITIAL_UPGRADES },
    availableOrders,
    workstations: createInitialWorkstations(),
    employees: [],
    candidates: generateCandidateMarket(1, 10),
    nextCandidateNumber: 5,
    completedRepairs: [],
    nextOrderNumber: INITIAL_ORDER_COUNT + 1,
    nextBoardRefreshAt: now + JOB_BOARD_REFRESH_MS,
    offlineCapacityMs: OFFLINE_CAPACITY_MS,
    lastActiveAt: now,
    lastSavedAt: now,
    lifetimeStats: createEconomyStats(),
    dailyStats: createDailyStats(now),
    transactions: [],
    recentCustomers: [],
    persistentCustomers: [],
    multiDeviceOrders: [],
    contractOffers: [],
    contracts: [],
    nextCustomerNumber: INITIAL_ORDER_COUNT + 1,
    nextMultiDeviceNumber: 1,
    nextContractNumber: 1,
  };
  return ensureChallenges(initial, now, getDayKey(now));
}

export function getRepairProgress(activeRepair: ActiveRepair | null, now: number) {
  if (!activeRepair) return 0;
  const total = activeRepair.endsAt - activeRepair.startedAt;
  const elapsed = now - activeRepair.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getEmployeeLevel(employeeXp: number) {
  let level = 1;
  EMPLOYEE_XP_THRESHOLDS.forEach((threshold, index) => {
    if (employeeXp >= threshold) level = index + 1;
  });
  return level;
}

export function getEmployeeLevelProgress(employeeXp: number) {
  const level = getEmployeeLevel(employeeXp);
  const current = EMPLOYEE_XP_THRESHOLDS[level - 1] ?? 0;
  const next = EMPLOYEE_XP_THRESHOLDS[level] ?? current;
  return next === current
    ? { current: employeeXp, required: employeeXp, percent: 100 }
    : { current: employeeXp - current, required: next - current, percent: ((employeeXp - current) / (next - current)) * 100 };
}

export function getAssignedEmployee(state: GameState, workstation: Workstation) {
  return workstation.assignedEmployeeId
    ? state.employees.find((employee) => employee.id === workstation.assignedEmployeeId) ?? null
    : null;
}

export function getWorkstationEligibility(state: GameState, workstation: Workstation, order: RepairOrder) {
  if (workstation.status === "locked") return { eligible: false, reason: "Arbeitsplatz gesperrt" };
  if (workstation.activeRepair) return { eligible: false, reason: "Arbeitsplatz belegt" };
  if (!canAccessOrder(order, getProgressionContext(state))) return { eligible: false, reason: "Werkzeug oder Reputation fehlt" };
  if (state.money < order.materialCost) return { eligible: false, reason: "Materialbudget fehlt" };
  if (workstation.index === 1) return { eligible: true, reason: "Spieler", speed: 1, quality: 85, specializationBonus: false };
  const employee = getAssignedEmployee(state, workstation);
  if (!employee) return { eligible: false, reason: "Kein Mitarbeiter zugewiesen" };
  if (employee.skill < order.skillRequirement) return { eligible: false, reason: `Skill ${order.skillRequirement} benötigt` };
  const specializationBonus = employee.specialization === order.category;
  const researchSpeed = specializationBonus && state.researchedNodes.includes("specialized-repair") ? 1.25 / 1.15 : 1;
  return { eligible: true, reason: employee.name, speed: employee.speed * researchSpeed, quality: employee.quality, specializationBonus };
}

export function getWorkstationDuration(order: RepairOrder, upgrades: UpgradeLevels, speed: number, specializationBonus: boolean) {
  const workshopDuration = getEffectiveDuration(order.durationSeconds, upgrades);
  const combinedSpeed = speed * (specializationBonus ? 1.15 : 1);
  return Math.max(4, Math.round(workshopDuration / combinedSpeed));
}

export function startRepairAtWorkstation(state: GameState, orderId: string, workstationId: string, now = getCurrentTime()) {
  const order = state.availableOrders.find((item) => item.id === orderId);
  const workstation = state.workstations.find((item) => item.id === workstationId);
  if (!order || !workstation) return { state, error: "Auftrag oder Arbeitsplatz nicht gefunden" };
  const eligibility = getWorkstationEligibility(state, workstation, order);
  if (!eligibility.eligible) return { state, error: eligibility.reason };
  const duration = getWorkstationDuration(order, state.upgrades, eligibility.speed ?? 1, eligibility.specializationBonus ?? false);
  const activeRepair: ActiveRepair = {
    order,
    startedAt: now,
    endsAt: now + duration * 1000,
    effectiveDurationSeconds: duration,
    chargedMaterialCost: order.materialCost,
    assignedEmployeeId: workstation.assignedEmployeeId,
    speedMultiplier: eligibility.speed ?? 1,
    qualityRating: eligibility.quality ?? 85,
    specializationBonus: eligibility.specializationBonus ?? false,
    usedTools: [order.requiredTool],
  };
  const charged = applyTransaction(state, "MATERIAL_COST", -order.materialCost, order.id, now);
  return {
    state: {
      ...charged,
      availableOrders: state.availableOrders.filter((item) => item.id !== orderId),
      workstations: state.workstations.map((item) => item.id === workstationId ? { ...item, status: "repairing" as const, activeRepair } : item),
    },
    error: null,
  };
}

export function getRepairOperatingCost(state: GameState, activeRepair: ActiveRepair, workstation: Workstation) {
  if (!activeRepair.assignedEmployeeId) return 0;
  const employee = state.employees.find((item) => item.id === activeRepair.assignedEmployeeId);
  return employee ? getEmployeeOperatingCost(employee.class) + Math.max(0, workstation.index - 1) * 2 : 0;
}

function improveEmployee(employee: Employee, activeRepair: ActiveRepair) {
  const gainedXp = Math.round(activeRepair.order.repairXp * (activeRepair.specializationBonus ? 1.25 : 1));
  const oldLevel = employee.level;
  const xp = employee.xp + gainedXp;
  const level = getEmployeeLevel(xp);
  const gainedLevels = Math.max(0, level - oldLevel);
  return {
    employee: {
      ...employee,
      xp,
      level,
      skill: employee.skill + gainedLevels * 2,
      speed: Math.round((employee.speed + gainedLevels * 0.02) * 100) / 100,
      quality: Math.min(99, employee.quality + gainedLevels),
    },
    gainedXp,
    leveledUp: gainedLevels > 0,
  };
}

export function settleWorkstation(state: GameState, workstationId: string, now = getCurrentTime(), source?: RepairSource) {
  const workstation = state.workstations.find((item) => item.id === workstationId);
  if (!workstation?.activeRepair || now < workstation.activeRepair.endsAt) return { state, error: "Reparatur ist noch nicht abgeschlossen", earnings: 0, materialCost: 0, operatingCost: 0, profit: 0, reputation: 0, employeeXp: 0, leveledEmployee: null as string | null, companyLevelsGained: 0, researchPointsGained: 0 };
  const activeRepair = workstation.activeRepair;
  const repairSource: RepairSource = source ?? (workstation.automationEnabled ? "automated" : "manual");
  const operatingCost = getRepairOperatingCost(state, activeRepair, workstation);
  const qualityBonus = Math.max(0, Math.floor((activeRepair.qualityRating - 82) / 10));
  const reputationGain = activeRepair.order.reputationReward + qualityBonus;
  let employeeXp = 0;
  let leveledEmployee: string | null = null;
  let employees = state.employees;
  if (activeRepair.assignedEmployeeId) {
    employees = state.employees.map((employee) => {
      if (employee.id !== activeRepair.assignedEmployeeId) return employee;
      const improved = improveEmployee(employee, activeRepair);
      employeeXp = improved.gainedXp;
      if (improved.leveledUp) leveledEmployee = improved.employee.name;
      return { ...improved.employee, repairsCompleted: improved.employee.repairsCompleted + 1, revenueGenerated: improved.employee.revenueGenerated + activeRepair.order.reward };
    });
  }
  let economicState = applyTransaction(state, "REPAIR_REWARD", activeRepair.order.reward, activeRepair.order.id, now);
  if (operatingCost > 0) economicState = applyTransaction(economicState, "OPERATING_COST", -operatingCost, activeRepair.order.id, now);
  economicState = recordRepairEconomy(economicState, {
    revenue: activeRepair.order.reward,
    materialCost: activeRepair.chargedMaterialCost,
    operatingCost,
    reputation: reputationGain,
    category: activeRepair.order.category,
    source: repairSource,
  }, now);
  const profit = activeRepair.order.reward - activeRepair.chargedMaterialCost - operatingCost;
  let partial: GameState = {
    ...economicState,
    reputation: state.reputation + reputationGain,
    employees,
    workstations: state.workstations.map((item) => item.id === workstationId ? { ...item, status: "available" as const, activeRepair: null } : item),
    completedRepairs: [{ id: activeRepair.order.id, device: activeRepair.order.device, issue: activeRepair.order.issue, reward: activeRepair.order.reward, materialCost: activeRepair.chargedMaterialCost, operatingCost, profit, category: activeRepair.order.category, source: repairSource, reputationReward: reputationGain, completedAt: now }, ...state.completedRepairs].slice(0, 20),
  };
  const companyProgress = awardCompanyXp(partial, activeRepair.order.repairXp, now);
  partial = applyChallengeEvent(companyProgress.state, {
    type: "REPAIR_COMPLETED",
    profit,
    reputation: reputationGain,
    order: activeRepair.order,
    source: repairSource,
    specializationMatched: activeRepair.specializationBonus,
  });
  partial = recordCustomerRepair(partial, activeRepair.order, now);
  partial = recordContractProgress(partial, activeRepair.order, now);
  const multiId = activeRepair.order.multiDeviceOrderId;
  if (multiId) {
    const group = partial.multiDeviceOrders.find((order) => order.orderId === multiId);
    if (group?.status === "active") {
      const completedItems = Math.min(group.totalItems, group.completedItems + 1);
      const groupCompleted = completedItems === group.totalItems;
      partial = { ...partial, multiDeviceOrders: partial.multiDeviceOrders.map((order) => order.orderId === multiId ? { ...order, completedItems, status: groupCompleted ? "completed" as const : order.status } : order), lifetimeStats: groupCompleted ? { ...partial.lifetimeStats, multiDeviceOrdersCompleted: partial.lifetimeStats.multiDeviceOrdersCompleted + 1 } : partial.lifetimeStats };
    }
  }
  partial = maybeCreateContractOffer(partial, activeRepair.order.customerId, now);
  const filled = fillOrderBoard(partial, getProgressionContext(partial), now);
  return {
    state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber, nextCustomerNumber: filled.nextCustomerNumber },
    error: null,
    earnings: activeRepair.order.reward,
    materialCost: activeRepair.chargedMaterialCost,
    operatingCost,
    profit,
    reputation: reputationGain,
    employeeXp,
    leveledEmployee,
    companyLevelsGained: companyProgress.levelsGained,
    researchPointsGained: companyProgress.researchPointsGained,
  };
}

function automationScore(order: RepairOrder, employee: Employee, priority: Workstation["automationPriority"], upgrades: UpgradeLevels) {
  const operatingCost = getEmployeeOperatingCost(employee.class);
  const economy = getJobEconomy(order, upgrades, employee.speed, employee.specialization === order.category, operatingCost);
  switch (priority) {
    case "highest-profit": return economy.estimatedProfit;
    case "fastest-jobs": return economy.profitPerMinute;
    case "reputation": return order.reputationReward * 1_000 + order.reward;
    case "specialization": return (order.category === employee.specialization ? 100_000 : 0) + order.reward;
  }
}

export function selectAutomationOrder(state: GameState, workstation: Workstation) {
  const employee = getAssignedEmployee(state, workstation);
  if (!employee) return null;
  const priority = workstation.automationPriority === "fastest-jobs" && !state.researchedNodes.includes("advanced-automation") ? "highest-profit" : workstation.automationPriority;
  return state.availableOrders
    .filter((order) => getWorkstationEligibility(state, workstation, order).eligible)
    .sort((a, b) => automationScore(b, employee, priority, state.upgrades) - automationScore(a, employee, priority, state.upgrades))[0] ?? null;
}

export function runWorkstationTick(state: GameState, now = getCurrentTime()) {
  let next = ensureChallenges(expireContracts(refreshOrderBoard(state, now), now), now, getDayKey(now));
  let changed = next !== state;
  const messages: string[] = [];

  for (const workstation of next.workstations) {
    const current = next.workstations.find((item) => item.id === workstation.id)!;
    if (current.activeRepair && now >= current.activeRepair.endsAt) {
      if (current.automationEnabled && current.assignedEmployeeId) {
        const settled = settleWorkstation(next, current.id, now, "automated");
        next = settled.state;
        changed = true;
        messages.push(`${current.index}: ${settled.profit} € Gewinn`);
      } else if (current.status !== "completed") {
        next = { ...next, workstations: next.workstations.map((item) => item.id === current.id ? { ...item, status: "completed" as const } : item) };
        changed = true;
      }
    }
  }

  for (const workstation of next.workstations) {
    const current = next.workstations.find((item) => item.id === workstation.id)!;
    if (!current.automationEnabled || current.status !== "available" || !current.assignedEmployeeId) continue;
    const suitable = selectAutomationOrder(next, current);
    if (suitable) {
      const started = startRepairAtWorkstation(next, suitable.id, current.id, now);
      next = started.state;
      changed = true;
    }
  }
  return { state: next, changed, notice: messages.length > 0 ? `Auto Repair abgeschlossen · ${messages.join(" · ")}` : null };
}

function addOfflinePipelineOrder(state: GameState, workstation: Workstation, now: number) {
  let next = state;
  for (let attempt = 0; attempt < ORDER_TEMPLATES.length * 2; attempt += 1) {
    const order = createOrder(next.nextOrderNumber, getProgressionContext(next), now + attempt, "accessible");
    const candidateState = { ...next, availableOrders: [...next.availableOrders, order], nextOrderNumber: next.nextOrderNumber + 1 };
    const current = candidateState.workstations.find((item) => item.id === workstation.id)!;
    const selected = selectAutomationOrder(candidateState, current);
    next = { ...next, nextOrderNumber: next.nextOrderNumber + 1 };
    if (selected) return { state: candidateState, order: selected };
  }
  return { state: next, order: null };
}

export function processOfflineProgress(state: GameState, now = getCurrentTime()) {
  const window = getOfflineWindow(state.lastActiveAt || state.lastSavedAt, now, state.offlineCapacityMs);
  let next = refreshOrderBoard(state, state.lastActiveAt || state.lastSavedAt);
  const summary: OfflineSummary = {
    durationMs: window.durationMs,
    productiveDurationMs: window.productiveDurationMs,
    capacityReached: window.capacityReached,
    completedRepairs: 0,
    revenue: 0,
    materialCosts: 0,
    operatingCosts: 0,
    profit: 0,
    reputation: 0,
    employeeXp: 0,
    levelUps: [],
    companyLevelsGained: 0,
    researchPointsGained: 0,
  };
  if (window.productiveDurationMs <= 0) return { state: { ...next, lastActiveAt: now }, summary: null };

  const simulationStart = state.lastActiveAt || state.lastSavedAt;
  for (const workstation of next.workstations) {
    const current = next.workstations.find((item) => item.id === workstation.id)!;
    if (!current.automationEnabled || !current.assignedEmployeeId || current.activeRepair || current.status !== "available") continue;
    let selected = selectAutomationOrder(next, current);
    if (!selected) {
      const pipeline = addOfflinePipelineOrder(next, current, simulationStart);
      next = pipeline.state;
      selected = pipeline.order;
    }
    if (selected) next = startRepairAtWorkstation(next, selected.id, current.id, simulationStart).state;
  }

  let events = 0;
  const maxEvents = 40_000;
  while (events < maxEvents) {
    let nextEvent: { workstation: Workstation; endsAt: number } | null = null;
    for (const station of next.workstations) {
      if (!station.activeRepair || station.status === "completed" || station.activeRepair.endsAt > window.simulationEnd) continue;
      if (!nextEvent || station.activeRepair.endsAt < nextEvent.endsAt) nextEvent = { workstation: station, endsAt: station.activeRepair.endsAt };
    }
    if (!nextEvent) break;
    const station = next.workstations.find((item) => item.id === nextEvent!.workstation.id)!;
    if (!station.automationEnabled || !station.assignedEmployeeId) {
      next = { ...next, workstations: next.workstations.map((item) => item.id === station.id ? { ...item, status: "completed" as const } : item) };
      continue;
    }
    const settled = settleWorkstation(next, station.id, nextEvent.endsAt, "offline");
    next = settled.state;
    summary.completedRepairs += 1;
    summary.revenue += settled.earnings;
    summary.materialCosts += settled.materialCost;
    summary.operatingCosts += settled.operatingCost;
    summary.profit += settled.profit;
    summary.reputation += settled.reputation;
    summary.employeeXp += settled.employeeXp;
    summary.companyLevelsGained += settled.companyLevelsGained;
    summary.researchPointsGained += settled.researchPointsGained;
    if (settled.leveledEmployee && !summary.levelUps.includes(settled.leveledEmployee)) summary.levelUps.push(settled.leveledEmployee);
    const current = next.workstations.find((item) => item.id === station.id)!;
    let selected = selectAutomationOrder(next, current);
    if (!selected) {
      const pipeline = addOfflinePipelineOrder(next, current, nextEvent.endsAt);
      next = pipeline.state;
      selected = pipeline.order;
    }
    if (selected) next = startRepairAtWorkstation(next, selected.id, station.id, nextEvent.endsAt).state;
    events += 1;
  }

  const pausedMs = now - window.simulationEnd;
  if (pausedMs > 0) {
    next = {
      ...next,
      workstations: next.workstations.map((station) => station.activeRepair && station.status === "repairing"
        ? { ...station, activeRepair: { ...station.activeRepair, startedAt: station.activeRepair.startedAt + pausedMs, endsAt: station.activeRepair.endsAt + pausedMs } }
        : station),
    };
  }
  next = refreshOrderBoard({ ...next, lastActiveAt: now, lastSavedAt: now }, now);
  return { state: next, summary: window.durationMs >= 60_000 ? summary : null };
}

export function getNextToolId(ownedTools: ToolId[]) {
  return (["basic-kit", "multimeter", "soldering-station", "hot-air-station", "microscope"] as ToolId[])
    .find((toolId) => !ownedTools.includes(toolId));
}

