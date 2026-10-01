"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MARKET_REFRESH_COST, generateCandidateMarket } from "@/game/data/employees";
import { REPUTATION_MILESTONES, SAVE_VERSION, getTool, getUpgrade } from "@/game/data/progression";
import {
  createInitialState,
  createOrderBoard,
  fillOrderBoard,
  getBoardSize,
  getProgressionContext,
  getRepairLevel,
  getUpgradeCost,
  processOfflineProgress,
  runWorkstationTick,
  settleWorkstation,
  startRepairAtWorkstation,
} from "@/game/logic/game";
import { migrateSave } from "@/game/logic/save";
import { applyTransaction } from "@/game/logic/economy";
import { getCurrentTime } from "@/game/logic/time";
import type { AutomationPriority, GameState, OfflineSummary, ToolId, UpgradeId } from "@/game/types";

const STORAGE_KEY = "repair-empire-save-v1";

function loadGameSession(): { state: GameState; offlineSummary: OfflineSummary | null } {
  if (typeof window === "undefined") return { state: createInitialState(), offlineSummary: null };
  try {
    const rawSave = window.localStorage.getItem(STORAGE_KEY);
    if (rawSave) {
      const migrated = migrateSave(JSON.parse(rawSave));
      if (migrated) {
        const offline = processOfflineProgress(migrated);
        return { state: offline.state, offlineSummary: offline.summary };
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return { state: createInitialState(), offlineSummary: null };
}

const subscribeToHydration = () => () => undefined;
type Transaction = { state: GameState; notice: string };

export function useGame() {
  const [initialSession] = useState(loadGameSession);
  const [state, setState] = useState<GameState>(initialSession.state);
  const stateRef = useRef(state);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(initialSession.offlineSummary);
  const [now, setNow] = useState(getCurrentTime);
  const [notice, setNotice] = useState<string | null>(null);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const applyState = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const commit = useCallback((transaction: (current: GameState) => Transaction) => {
    const result = transaction(stateRef.current);
    applyState(result.state);
    setNotice(result.notice);
  }, [applyState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const tickNow = getCurrentTime();
      setNow(tickNow);
      const result = runWorkstationTick(stateRef.current, tickNow);
      if (result.changed) {
        applyState(result.state);
        if (result.notice) setNotice(result.notice);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [applyState]);

  useEffect(() => {
    if (!hydrated) return;
    const savedAt = getCurrentTime();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, saveVersion: SAVE_VERSION, lastSavedAt: savedAt, lastActiveAt: savedAt }));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const saveHeartbeat = () => {
      const savedAt = getCurrentTime();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stateRef.current, saveVersion: SAVE_VERSION, lastSavedAt: savedAt, lastActiveAt: savedAt }));
    };
    const timer = window.setInterval(saveHeartbeat, 10_000);
    const onVisibility = () => { if (document.visibilityState === "hidden") saveHeartbeat(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const assignOrder = useCallback((orderId: string, workstationId: string) => commit((current) => {
    const started = startRepairAtWorkstation(current, orderId, workstationId);
    if (started.error) return { state: current, notice: started.error };
    const station = started.state.workstations.find((item) => item.id === workstationId)!;
    return { state: started.state, notice: `Auftrag an Arbeitsplatz ${station.index} übergeben · Material gebucht` };
  }), [commit]);

  const completeRepair = useCallback((workstationId: string) => commit((current) => {
    const oldLevel = getRepairLevel(current.repairXp);
    const oldReputation = current.reputation;
    const settled = settleWorkstation(current, workstationId);
    if (settled.error) return { state: current, notice: settled.error };
    const newLevel = getRepairLevel(settled.state.repairXp);
    const crossed = REPUTATION_MILESTONES.find((value) => oldReputation < value && settled.state.reputation >= value);
    const progress = settled.leveledEmployee
      ? ` · ${settled.leveledEmployee} ist aufgestiegen`
      : newLevel > oldLevel
        ? ` · Repair-Level ${newLevel} erreicht`
        : crossed
          ? ` · Reputation ${crossed} erreicht`
          : "";
    return { state: settled.state, notice: `Reparatur abgenommen · ${settled.profit} € Gewinn${progress}` };
  }), [commit]);

  const purchaseWorkstation = useCallback((workstationId: string) => commit((current) => {
    const workstation = current.workstations.find((item) => item.id === workstationId);
    if (!workstation || workstation.status !== "locked") return { state: current, notice: "Arbeitsplatz ist bereits freigeschaltet" };
    if (current.reputation < workstation.requiredReputation) return { state: current, notice: `Reputation ${workstation.requiredReputation} benötigt` };
    if (current.money < workstation.purchasePrice) return { state: current, notice: `Für Arbeitsplatz ${workstation.index} fehlen ${workstation.purchasePrice - current.money} €` };
    const previous = current.workstations.find((item) => item.index === workstation.index - 1);
    if (previous?.status === "locked") return { state: current, notice: `Zuerst Arbeitsplatz ${workstation.index - 1} freischalten` };
    const charged = applyTransaction(current, "WORKSTATION_PURCHASE", -workstation.purchasePrice, workstation.id, getCurrentTime());
    return {
      state: { ...charged, workstations: current.workstations.map((item) => item.id === workstationId ? { ...item, status: "available" as const } : item) },
      notice: `Arbeitsplatz ${workstation.index} freigeschaltet`,
    };
  }), [commit]);

  const hireCandidate = useCallback((candidateId: string) => commit((current) => {
    const candidate = current.candidates.find((item) => item.id === candidateId);
    if (!candidate) return { state: current, notice: "Kandidat ist nicht mehr verfügbar" };
    if (current.money < candidate.hiringCost) return { state: current, notice: `Für ${candidate.name} fehlen ${candidate.hiringCost - current.money} €` };
    const charged = applyTransaction(current, "EMPLOYEE_HIRE", -candidate.hiringCost, candidate.id, getCurrentTime());
    return {
      state: {
        ...charged,
        candidates: current.candidates.filter((item) => item.id !== candidateId),
        employees: [...current.employees, { ...candidate, xp: 0, level: 1, assignedWorkstationId: null, repairsCompleted: 0, revenueGenerated: 0 }],
      },
      notice: `${candidate.name} wurde eingestellt`,
    };
  }), [commit]);

  const refreshCandidates = useCallback(() => commit((current) => {
    if (current.money < MARKET_REFRESH_COST) return { state: current, notice: `Für neue Kandidaten fehlen ${MARKET_REFRESH_COST - current.money} €` };
    const candidates = generateCandidateMarket(current.nextCandidateNumber, current.reputation);
    const charged = applyTransaction(current, "MARKET_REFRESH", -MARKET_REFRESH_COST, "candidate-market", getCurrentTime());
    return {
      state: { ...charged, candidates, nextCandidateNumber: current.nextCandidateNumber + candidates.length },
      notice: "Kandidatenmarkt aktualisiert",
    };
  }), [commit]);

  const assignEmployee = useCallback((workstationId: string, employeeId: string | null) => commit((current) => {
    const target = current.workstations.find((item) => item.id === workstationId);
    if (!target || target.index === 1 || target.status === "locked") return { state: current, notice: "Dieser Arbeitsplatz kann nicht besetzt werden" };
    if (target.activeRepair) return { state: current, notice: "Zuweisung während einer Reparatur gesperrt" };
    const employee = employeeId ? current.employees.find((item) => item.id === employeeId) : null;
    if (employeeId && !employee) return { state: current, notice: "Mitarbeiter nicht gefunden" };
    const previousStation = employee?.assignedWorkstationId
      ? current.workstations.find((item) => item.id === employee.assignedWorkstationId)
      : null;
    if (previousStation?.activeRepair) return { state: current, notice: `${employee!.name} arbeitet noch an Arbeitsplatz ${previousStation.index}` };
    const displacedId = target.assignedEmployeeId;
    const workstations = current.workstations.map((item) => {
      if (employee?.assignedWorkstationId === item.id) return { ...item, assignedEmployeeId: null, automationEnabled: false };
      if (item.id === workstationId) return { ...item, assignedEmployeeId: employeeId, automationEnabled: employeeId ? item.automationEnabled : false };
      return item;
    });
    const employees = current.employees.map((item) => {
      if (item.id === employeeId) return { ...item, assignedWorkstationId: workstationId };
      if (item.id === displacedId || item.assignedWorkstationId === workstationId) return { ...item, assignedWorkstationId: null };
      return item;
    });
    return { state: { ...current, workstations, employees }, notice: employee ? `${employee.name} arbeitet jetzt an Arbeitsplatz ${target.index}` : `Arbeitsplatz ${target.index} ist nicht besetzt` };
  }), [commit]);

  const toggleAutomation = useCallback((workstationId: string) => commit((current) => {
    const workstation = current.workstations.find((item) => item.id === workstationId);
    if (!workstation || workstation.index === 1 || !workstation.assignedEmployeeId) return { state: current, notice: "Für Auto Repair wird ein Mitarbeiter benötigt" };
    const enabled = !workstation.automationEnabled;
    return { state: { ...current, workstations: current.workstations.map((item) => item.id === workstationId ? { ...item, automationEnabled: enabled } : item) }, notice: `Auto Repair an Arbeitsplatz ${workstation.index}: ${enabled ? "ON" : "OFF"}` };
  }), [commit]);

  const setAutomationPriority = useCallback((workstationId: string, priority: AutomationPriority) => commit((current) => ({
    state: { ...current, workstations: current.workstations.map((item) => item.id === workstationId ? { ...item, automationPriority: priority } : item) },
    notice: "Automationspriorität aktualisiert",
  })), [commit]);

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
    const charged = applyTransaction(current, "TOOL_PURCHASE", -tool.price, tool.id, getCurrentTime());
    return { state: { ...charged, ownedTools, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count }, notice: `${tool.name} gekauft · neue Reparaturen freigeschaltet` };
  }), [commit]);

  const purchaseUpgrade = useCallback((upgradeId: UpgradeId) => commit((current) => {
    const upgrade = getUpgrade(upgradeId);
    const level = current.upgrades[upgradeId];
    const cost = getUpgradeCost(upgradeId, level);
    if (level >= upgrade.maxLevel) return { state: current, notice: `${upgrade.name} ist vollständig ausgebaut` };
    if (current.reputation < upgrade.requiredReputation) return { state: current, notice: `Noch ${upgrade.requiredReputation - current.reputation} Reputation bis ${upgrade.name}` };
    if (current.money < cost) return { state: current, notice: `Für das Upgrade fehlen ${cost - current.money} €` };
    const upgrades = { ...current.upgrades, [upgradeId]: level + 1 };
    const charged = applyTransaction(current, "UPGRADE_PURCHASE", -cost, upgrade.id, getCurrentTime());
    const partial = { ...charged, upgrades };
    const context = getProgressionContext(partial);
    if (upgradeId === "customer-network") {
      const count = getBoardSize(upgrades);
      const orders = createOrderBoard(count, current.nextOrderNumber, context);
      return { state: { ...partial, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count }, notice: `${upgrade.name} Level ${level + 1} · Aufträge aktualisiert` };
    }
    const filled = fillOrderBoard(partial, context);
    return { state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber }, notice: `${upgrade.name} auf Level ${level + 1} verbessert` };
  }), [commit]);

  return {
    state,
    hydrated,
    now,
    notice,
    offlineSummary,
    assignOrder,
    completeRepair,
    purchaseWorkstation,
    hireCandidate,
    refreshCandidates,
    assignEmployee,
    toggleAutomation,
    setAutomationPriority,
    dismissOfflineSummary: () => setOfflineSummary(null),
    purchaseTool,
    purchaseUpgrade,
  };
}

