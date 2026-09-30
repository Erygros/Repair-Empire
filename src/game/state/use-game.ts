"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { REPUTATION_MILESTONES, SAVE_VERSION, getTool, getUpgrade } from "@/game/data/progression";
import {
  canAccessOrder,
  createInitialState,
  createOrderBoard,
  fillOrderBoard,
  getBoardSize,
  getEffectiveDuration,
  getProgressionContext,
  getRepairLevel,
  getRepairProgress,
  getUpgradeCost,
} from "@/game/logic/game";
import { migrateSave } from "@/game/logic/save";
import type { GameState, ToolId, UpgradeId } from "@/game/types";

const STORAGE_KEY = "repair-empire-save-v1";

function loadGame(): GameState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const rawSave = window.localStorage.getItem(STORAGE_KEY);
    if (rawSave) return migrateSave(JSON.parse(rawSave)) ?? createInitialState();
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return createInitialState();
}

const subscribeToHydration = () => () => undefined;
type Transaction = { state: GameState; notice: string };

export function useGame() {
  const [state, setState] = useState<GameState>(loadGame);
  const stateRef = useRef(state);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const commit = useCallback((transaction: (current: GameState) => Transaction) => {
    const result = transaction(stateRef.current);
    stateRef.current = result.state;
    setState(result.state);
    setNotice(result.notice);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, saveVersion: SAVE_VERSION, lastSavedAt: Date.now() }));
  }, [state, hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const progress = useMemo(() => getRepairProgress(state.activeRepair, now), [state.activeRepair, now]);

  const acceptOrder = useCallback((orderId: string) => commit((current) => {
    if (current.activeRepair) return { state: current, notice: "Werkbank 01 ist bereits belegt" };
    const order = current.availableOrders.find((item) => item.id === orderId);
    if (!order) return { state: current, notice: "Auftrag ist nicht mehr verfügbar" };
    const context = getProgressionContext(current);
    if (!canAccessOrder(order, context)) return { state: current, notice: `Voraussetzung fehlt: ${getTool(order.requiredTool).name} oder Reputation ${order.requiredReputation}` };
    if (current.money < order.materialCost) return { state: current, notice: `Für das Material fehlen ${order.materialCost - current.money} €` };
    const startedAt = Date.now();
    const effectiveDurationSeconds = getEffectiveDuration(order.durationSeconds, current.upgrades);
    return {
      state: {
        ...current,
        money: current.money - order.materialCost,
        availableOrders: current.availableOrders.filter((item) => item.id !== orderId),
        activeRepair: { order, startedAt, endsAt: startedAt + effectiveDurationSeconds * 1000, effectiveDurationSeconds, chargedMaterialCost: order.materialCost },
      },
      notice: `${order.device} eingespannt · ${order.materialCost} € Material gebucht`,
    };
  }), [commit]);

  const completeRepair = useCallback(() => commit((current) => {
    if (!current.activeRepair || Date.now() < current.activeRepair.endsAt) return { state: current, notice: "Reparatur ist noch nicht abgeschlossen" };
    const { order } = current.activeRepair;
    const oldLevel = getRepairLevel(current.repairXp);
    const newReputation = current.reputation + order.reputationReward;
    const newXp = current.repairXp + order.repairXp;
    const newLevel = getRepairLevel(newXp);
    const context = { ownedTools: current.ownedTools, reputation: newReputation, upgrades: current.upgrades };
    const partial: GameState = {
      ...current,
      money: current.money + order.reward,
      reputation: newReputation,
      repairXp: newXp,
      activeRepair: null,
      completedRepairs: [{ id: order.id, device: order.device, issue: order.issue, reward: order.reward, reputationReward: order.reputationReward, completedAt: Date.now() }, ...current.completedRepairs].slice(0, 20),
    };
    const filled = fillOrderBoard(partial, context);
    const crossed = REPUTATION_MILESTONES.find((value) => current.reputation < value && newReputation >= value);
    const progressionNotice = newLevel > oldLevel ? ` · Repair-Level ${newLevel} erreicht` : crossed ? ` · Reputation ${crossed} erreicht` : "";
    return { state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber }, notice: `Reparatur abgenommen · +${order.reward} €${progressionNotice}` };
  }), [commit]);

  const purchaseTool = useCallback((toolId: ToolId) => commit((current) => {
    const tool = getTool(toolId);
    if (current.ownedTools.includes(toolId)) return { state: current, notice: `${tool.name} ist bereits vorhanden` };
    if (current.reputation < tool.requiredReputation) return { state: current, notice: `Noch ${tool.requiredReputation - current.reputation} Reputation bis ${tool.name}` };
    if (tool.requiredTool && !current.ownedTools.includes(tool.requiredTool)) return { state: current, notice: `Zuerst ${getTool(tool.requiredTool).name} anschaffen` };
    if (current.money < tool.price) return { state: current, notice: `Für ${tool.name} fehlen ${tool.price - current.money} €` };
    const ownedTools = [...current.ownedTools, toolId];
    const context = { ownedTools, reputation: current.reputation, upgrades: current.upgrades };
    const count = getBoardSize(current.upgrades);
    const orders = createOrderBoard(count, current.nextOrderNumber, context);
    return {
      state: { ...current, money: current.money - tool.price, ownedTools, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count },
      notice: `${tool.name} gekauft · ${tool.unlocks.join(" & ")} freigeschaltet`,
    };
  }), [commit]);

  const purchaseUpgrade = useCallback((upgradeId: UpgradeId) => commit((current) => {
    const upgrade = getUpgrade(upgradeId);
    const level = current.upgrades[upgradeId];
    const cost = getUpgradeCost(upgradeId, level);
    if (level >= upgrade.maxLevel) return { state: current, notice: `${upgrade.name} ist vollständig ausgebaut` };
    if (current.reputation < upgrade.requiredReputation) return { state: current, notice: `Noch ${upgrade.requiredReputation - current.reputation} Reputation bis ${upgrade.name}` };
    if (current.money < cost) return { state: current, notice: `Für das Upgrade fehlen ${cost - current.money} €` };
    const upgrades = { ...current.upgrades, [upgradeId]: level + 1 };
    const partial = { ...current, money: current.money - cost, upgrades };
    const context = getProgressionContext(partial);
    if (upgradeId === "customer-network") {
      const count = getBoardSize(upgrades);
      const orders = createOrderBoard(count, current.nextOrderNumber, context);
      return { state: { ...partial, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count }, notice: `${upgrade.name} auf Level ${level + 1} verbessert · Aufträge aktualisiert` };
    }
    const filled = fillOrderBoard(partial, context);
    return { state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber }, notice: `${upgrade.name} auf Level ${level + 1} verbessert` };
  }), [commit]);

  return { state, hydrated, now, notice, progress, acceptOrder, completeRepair, purchaseTool, purchaseUpgrade };
}

