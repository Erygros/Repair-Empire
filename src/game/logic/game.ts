import { CUSTOMER_NAMES, ORDER_TEMPLATES } from "@/game/data/orders";
import { INITIAL_UPGRADES, REPAIR_LEVEL_THRESHOLDS, SAVE_VERSION, getUpgrade } from "@/game/data/progression";
import type { GameState, ProgressionContext, RepairOrder, ToolId, UpgradeId, UpgradeLevels } from "@/game/types";

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
    activeRepair: null,
    completedRepairs: [],
    nextOrderNumber: INITIAL_ORDER_COUNT + 1,
    lastSavedAt: now,
  };
}

export function getRepairProgress(activeRepair: GameState["activeRepair"], now: number) {
  if (!activeRepair) return 0;
  const total = activeRepair.endsAt - activeRepair.startedAt;
  const elapsed = now - activeRepair.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getNextToolId(ownedTools: ToolId[]) {
  return (["basic-kit", "multimeter", "soldering-station", "hot-air-station", "microscope"] as ToolId[])
    .find((toolId) => !ownedTools.includes(toolId));
}

