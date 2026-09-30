import { CUSTOMER_NAMES, ORDER_TEMPLATES } from "@/game/data/orders";
import type { GameState, RepairOrder } from "@/game/types";

const INITIAL_ORDER_COUNT = 5;

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function createOrder(orderNumber: number, now = Date.now()): RepairOrder {
  const template = pick(ORDER_TEMPLATES);
  const urgency = Math.random() > 0.78 ? "express" : "standard";
  const expressMultiplier = urgency === "express" ? 1.25 : 1;

  return {
    ...template,
    id: `RE-${String(orderNumber).padStart(4, "0")}`,
    customer: pick(CUSTOMER_NAMES),
    urgency,
    reward: Math.round(template.reward * expressMultiplier),
    createdAt: now,
  };
}

export function createInitialState(): GameState {
  const now = Date.now();
  const availableOrders = Array.from({ length: INITIAL_ORDER_COUNT }, (_, index) =>
    createOrder(index + 1, now + index),
  );

  return {
    money: 500,
    reputation: 10,
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

