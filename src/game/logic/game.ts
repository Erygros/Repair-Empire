import { CUSTOMER_NAMES, ORDER_TEMPLATES } from "@/game/data/orders";
import { EMPLOYEE_XP_THRESHOLDS, createInitialWorkstations, generateCandidateMarket } from "@/game/data/employees";
import { INITIAL_UPGRADES, REPAIR_LEVEL_THRESHOLDS, SAVE_VERSION, getUpgrade } from "@/game/data/progression";
import type { ActiveRepair, Employee, GameState, OfflineSummary, ProgressionContext, RepairOrder, ToolId, UpgradeId, UpgradeLevels, Workstation } from "@/game/types";

const INITIAL_ORDER_COUNT = 5;

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
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
  return Math.random() < 0.22 ? locked : accessible;
}

export function createOrder(
  orderNumber: number,
  context: ProgressionContext,
  now = Date.now(),
  preference: "accessible" | "locked" | "mixed" = "mixed",
): RepairOrder {
  const pool = getTemplatePool(context, preference);
  const networkLevel = context.upgrades["customer-network"];
  const weightedPool = pool.flatMap((template) =>
    Array.from({ length: 1 + Math.max(0, template.difficulty - 1) * networkLevel }, () => template),
  );
  const template = pick(weightedPool);
  const urgency = Math.random() > Math.max(0.58, 0.8 - networkLevel * 0.035) ? "express" : "standard";
  const expressMultiplier = urgency === "express" ? 1.25 : 1;
  const rewardMultiplier = 1 + networkLevel * 0.05 + context.upgrades["workshop-organization"] * 0.03;
  const materialMultiplier = 1 - context.upgrades["better-diagnostics"] * 0.06;

  return {
    ...template,
    id: `RE-${String(orderNumber).padStart(4, "0")}`,
    customer: pick(CUSTOMER_NAMES),
    urgency,
    reward: Math.round(template.reward * expressMultiplier * rewardMultiplier),
    materialCost: Math.max(1, Math.round(template.materialCost * materialMultiplier)),
    createdAt: now,
  };
}

export function getBoardSize(upgrades: UpgradeLevels) {
  return INITIAL_ORDER_COUNT + upgrades["job-board-expansion"];
}

export function createOrderBoard(
  count: number,
  firstOrderNumber: number,
  context: ProgressionContext,
  now = Date.now(),
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

export function fillOrderBoard(state: GameState, context: ProgressionContext) {
  const missing = Math.max(0, getBoardSize(context.upgrades) - state.availableOrders.length);
  const additions = Array.from({ length: missing }, (_, index) =>
    createOrder(state.nextOrderNumber + index, context, Date.now() + index),
  );
  return {
    orders: [...state.availableOrders, ...additions],
    nextOrderNumber: state.nextOrderNumber + missing,
  };
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
  let level = 1;
  REPAIR_LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (repairXp >= threshold) level = index + 1;
  });
  return level;
}

export function getRepairLevelProgress(repairXp: number) {
  const level = getRepairLevel(repairXp);
  const currentThreshold = REPAIR_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = REPAIR_LEVEL_THRESHOLDS[level] ?? currentThreshold;
  if (nextThreshold === currentThreshold) return { current: repairXp, required: repairXp, percent: 100 };
  return {
    current: repairXp - currentThreshold,
    required: nextThreshold - currentThreshold,
    percent: ((repairXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100,
  };
}

export function getProgressionContext(state: Pick<GameState, "ownedTools" | "reputation" | "upgrades">): ProgressionContext {
  return { ownedTools: state.ownedTools, reputation: state.reputation, upgrades: state.upgrades };
}

export function createInitialState(): GameState {
  const now = Date.now();
  const context: ProgressionContext = { ownedTools: ["basic-kit"], reputation: 10, upgrades: { ...INITIAL_UPGRADES } };
  const availableOrders = createOrderBoard(INITIAL_ORDER_COUNT, 1, context, now);
  return {
    saveVersion: SAVE_VERSION,
    money: 500,
    reputation: 10,
    repairXp: 0,
    ownedTools: ["basic-kit"],
    upgrades: { ...INITIAL_UPGRADES },
    availableOrders,
    workstations: createInitialWorkstations(),
    employees: [],
    candidates: generateCandidateMarket(1, 10),
    nextCandidateNumber: 5,
    completedRepairs: [],
    nextOrderNumber: INITIAL_ORDER_COUNT + 1,
    lastSavedAt: now,
  };
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
  return { eligible: true, reason: employee.name, speed: employee.speed, quality: employee.quality, specializationBonus };
}

export function getWorkstationDuration(order: RepairOrder, upgrades: UpgradeLevels, speed: number, specializationBonus: boolean) {
  const workshopDuration = getEffectiveDuration(order.durationSeconds, upgrades);
  const combinedSpeed = speed * (specializationBonus ? 1.15 : 1);
  return Math.max(4, Math.round(workshopDuration / combinedSpeed));
}

export function startRepairAtWorkstation(state: GameState, orderId: string, workstationId: string, now = Date.now()) {
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
  return {
    state: {
      ...state,
      money: state.money - order.materialCost,
      availableOrders: state.availableOrders.filter((item) => item.id !== orderId),
      workstations: state.workstations.map((item) => item.id === workstationId ? { ...item, status: "repairing" as const, activeRepair } : item),
    },
    error: null,
  };
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

export function settleWorkstation(state: GameState, workstationId: string, now = Date.now()) {
  const workstation = state.workstations.find((item) => item.id === workstationId);
  if (!workstation?.activeRepair || now < workstation.activeRepair.endsAt) return { state, error: "Reparatur ist noch nicht abgeschlossen", earnings: 0, reputation: 0, employeeXp: 0, leveledEmployee: null as string | null };
  const activeRepair = workstation.activeRepair;
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
      return improved.employee;
    });
  }
  const partial: GameState = {
    ...state,
    money: state.money + activeRepair.order.reward,
    reputation: state.reputation + reputationGain,
    repairXp: state.repairXp + activeRepair.order.repairXp,
    employees,
    workstations: state.workstations.map((item) => item.id === workstationId ? { ...item, status: "available" as const, activeRepair: null } : item),
    completedRepairs: [{ id: activeRepair.order.id, device: activeRepair.order.device, issue: activeRepair.order.issue, reward: activeRepair.order.reward, reputationReward: reputationGain, completedAt: now }, ...state.completedRepairs].slice(0, 20),
  };
  const filled = fillOrderBoard(partial, getProgressionContext(partial));
  return {
    state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber },
    error: null,
    earnings: activeRepair.order.reward,
    reputation: reputationGain,
    employeeXp,
    leveledEmployee,
  };
}

function automationScore(order: RepairOrder, employee: Employee, priority: Workstation["automationPriority"]) {
  switch (priority) {
    case "highest-profit": return order.reward - order.materialCost;
    case "fastest-jobs": return 10_000 - order.durationSeconds * 100;
    case "reputation": return order.reputationReward * 1_000 + order.reward;
    case "specialization": return (order.category === employee.specialization ? 100_000 : 0) + order.reward;
  }
}

export function runWorkstationTick(state: GameState, now = Date.now()) {
  let next = state;
  let changed = false;
  const messages: string[] = [];

  for (const workstation of next.workstations) {
    const current = next.workstations.find((item) => item.id === workstation.id)!;
    if (current.activeRepair && now >= current.activeRepair.endsAt) {
      if (current.automationEnabled && current.assignedEmployeeId) {
        const settled = settleWorkstation(next, current.id, now);
        next = settled.state;
        changed = true;
        messages.push(`${current.index}: +${settled.earnings} €`);
      } else if (current.status !== "completed") {
        next = { ...next, workstations: next.workstations.map((item) => item.id === current.id ? { ...item, status: "completed" as const } : item) };
        changed = true;
      }
    }
  }

  for (const workstation of next.workstations) {
    const current = next.workstations.find((item) => item.id === workstation.id)!;
    if (!current.automationEnabled || current.status !== "available" || !current.assignedEmployeeId) continue;
    const employee = getAssignedEmployee(next, current);
    if (!employee) continue;
    const suitable = next.availableOrders
      .filter((order) => getWorkstationEligibility(next, current, order).eligible)
      .sort((a, b) => automationScore(b, employee, current.automationPriority) - automationScore(a, employee, current.automationPriority));
    if (suitable[0]) {
      const started = startRepairAtWorkstation(next, suitable[0].id, current.id, now);
      next = started.state;
      changed = true;
    }
  }
  return { state: next, changed, notice: messages.length > 0 ? `Auto Repair abgeschlossen · ${messages.join(" · ")}` : null };
}

export function processOfflineProgress(state: GameState, now = Date.now()) {
  let next = state;
  const summary: OfflineSummary = { durationMs: Math.max(0, now - state.lastSavedAt), completedRepairs: 0, earnings: 0, reputation: 0, employeeXp: 0 };
  for (const workstation of next.workstations) {
    const current = next.workstations.find((item) => item.id === workstation.id)!;
    if (!current.activeRepair || now < current.activeRepair.endsAt) continue;
    if (current.automationEnabled && current.assignedEmployeeId) {
      const settled = settleWorkstation(next, current.id, current.activeRepair.endsAt);
      next = settled.state;
      summary.completedRepairs += 1;
      summary.earnings += settled.earnings;
      summary.reputation += settled.reputation;
      summary.employeeXp += settled.employeeXp;
    } else {
      next = { ...next, workstations: next.workstations.map((item) => item.id === current.id ? { ...item, status: "completed" as const } : item) };
    }
  }
  return { state: next, summary: summary.completedRepairs > 0 ? summary : null };
}

export function getNextToolId(ownedTools: ToolId[]) {
  return (["basic-kit", "multimeter", "soldering-station", "hot-air-station", "microscope"] as ToolId[])
    .find((toolId) => !ownedTools.includes(toolId));
}

