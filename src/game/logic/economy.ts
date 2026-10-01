import { getDayKey } from "@/game/logic/time";
import type { EconomyStats, GameState, RepairCategory, RepairSource, TransactionType } from "@/game/types";

const EMPTY_CATEGORY_PROFIT: Record<RepairCategory, number> = {
  "Mobile Devices": 0,
  Consoles: 0,
  Computers: 0,
  Electronics: 0,
};

export function createEconomyStats(): EconomyStats {
  return {
    totalRevenue: 0,
    totalMaterialCosts: 0,
    totalOperatingCosts: 0,
    totalProfit: 0,
    repairsCompleted: 0,
    manualRepairs: 0,
    automatedRepairs: 0,
    offlineRepairs: 0,
    moneySpentOnTools: 0,
    moneySpentOnUpgrades: 0,
    moneySpentOnEmployees: 0,
    moneySpentOnWorkstations: 0,
    highestSingleRepairProfit: 0,
    totalReputationEarned: 0,
    customersServed: 0,
    returningCustomers: 0,
    multiDeviceOrdersCompleted: 0,
    contractsAccepted: 0,
    contractsCompleted: 0,
    contractsFailed: 0,
    contractRevenue: 0,
    highestContractBonus: 0,
    categoryProfit: { ...EMPTY_CATEGORY_PROFIT },
  };
}

export function createDailyStats(now: number) {
  return { dayKey: getDayKey(now), revenue: 0, materialCosts: 0, operatingCosts: 0, profit: 0, repairsCompleted: 0 };
}

function currentDaily(state: GameState, now: number) {
  return state.dailyStats.dayKey === getDayKey(now) ? state.dailyStats : createDailyStats(now);
}

export function applyTransaction(state: GameState, type: TransactionType, amount: number, reference: string, now: number) {
  if (!Number.isFinite(amount) || amount === 0) return state;
  const rounded = Math.round(amount);
  const nextMoney = state.money + rounded;
  if (nextMoney < 0) return state;
  const stats = { ...state.lifetimeStats };
  if (type === "TOOL_PURCHASE") stats.moneySpentOnTools += Math.abs(rounded);
  if (type === "UPGRADE_PURCHASE") stats.moneySpentOnUpgrades += Math.abs(rounded);
  if (type === "EMPLOYEE_HIRE") stats.moneySpentOnEmployees += Math.abs(rounded);
  if (type === "WORKSTATION_PURCHASE") stats.moneySpentOnWorkstations += Math.abs(rounded);
  return {
    ...state,
    money: nextMoney,
    lifetimeStats: stats,
    transactions: [
      { id: `${now}-${type}-${reference}`, type, amount: rounded, createdAt: now, reference },
      ...state.transactions,
    ].slice(0, 80),
  };
}

export function recordRepairEconomy(
  state: GameState,
  values: { revenue: number; materialCost: number; operatingCost: number; reputation: number; category: RepairCategory; source: RepairSource },
  now: number,
) {
  const profit = values.revenue - values.materialCost - values.operatingCost;
  const daily = currentDaily(state, now);
  const sourceKey = values.source === "manual" ? "manualRepairs" : values.source === "offline" ? "offlineRepairs" : "automatedRepairs";
  return {
    ...state,
    lifetimeStats: {
      ...state.lifetimeStats,
      totalRevenue: state.lifetimeStats.totalRevenue + values.revenue,
      totalMaterialCosts: state.lifetimeStats.totalMaterialCosts + values.materialCost,
      totalOperatingCosts: state.lifetimeStats.totalOperatingCosts + values.operatingCost,
      totalProfit: state.lifetimeStats.totalProfit + profit,
      repairsCompleted: state.lifetimeStats.repairsCompleted + 1,
      [sourceKey]: state.lifetimeStats[sourceKey] + 1,
      highestSingleRepairProfit: Math.max(state.lifetimeStats.highestSingleRepairProfit, profit),
      totalReputationEarned: state.lifetimeStats.totalReputationEarned + values.reputation,
      categoryProfit: { ...state.lifetimeStats.categoryProfit, [values.category]: state.lifetimeStats.categoryProfit[values.category] + profit },
    },
    dailyStats: {
      ...daily,
      revenue: daily.revenue + values.revenue,
      materialCosts: daily.materialCosts + values.materialCost,
      operatingCosts: daily.operatingCosts + values.operatingCost,
      profit: daily.profit + profit,
      repairsCompleted: daily.repairsCompleted + 1,
    },
  };
}
