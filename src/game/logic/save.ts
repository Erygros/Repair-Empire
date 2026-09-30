import { ORDER_TEMPLATES } from "@/game/data/orders";
import { INITIAL_UPGRADES, SAVE_VERSION } from "@/game/data/progression";
import { createInitialState } from "@/game/logic/game";
import type { ActiveRepair, GameState, RepairOrder, UpgradeId } from "@/game/types";

function isBaseSave(value: unknown): value is Partial<GameState> & Pick<GameState, "money" | "reputation" | "availableOrders" | "completedRepairs" | "nextOrderNumber"> {
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
  } as RepairOrder;
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

  let activeRepair: ActiveRepair | null = null;
  if (value.activeRepair) {
    const legacy = value.activeRepair as Partial<ActiveRepair>;
    if (legacy.order && typeof legacy.startedAt === "number" && typeof legacy.endsAt === "number") {
      const order = migrateOrder(legacy.order);
      activeRepair = {
        order,
        startedAt: legacy.startedAt,
        endsAt: legacy.endsAt,
        effectiveDurationSeconds: legacy.effectiveDurationSeconds ?? order.durationSeconds,
        chargedMaterialCost: legacy.chargedMaterialCost ?? 0,
      };
    }
  }

  return {
    ...base,
    ...value,
    saveVersion: SAVE_VERSION,
    repairXp: typeof value.repairXp === "number" ? value.repairXp : value.completedRepairs.length * 12,
    ownedTools: Array.isArray(value.ownedTools) && value.ownedTools.length > 0 ? value.ownedTools : ["basic-kit"],
    upgrades,
    availableOrders: value.availableOrders.map(migrateOrder),
    activeRepair,
  };
}

