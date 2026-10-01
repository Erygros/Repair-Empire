"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MARKET_REFRESH_COST, generateCandidateMarket } from "@/game/data/employees";
import { getMilestone } from "@/game/data/milestones";
import { REPUTATION_MILESTONES, RESEARCH_NODES, SAVE_VERSION, getTool, getUpgrade } from "@/game/data/progression";
import {
  createInitialState,
  createMultiDeviceOrder,
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
import { acceptContract, claimContract } from "@/game/logic/contracts";
import { applyFounderBonus } from "@/game/data/founder-skills";
import { migrateSave } from "@/game/logic/save";
import { applyTransaction } from "@/game/logic/economy";
import { ensureChallenges } from "@/game/logic/challenges";
import { awardCompanyXp } from "@/game/logic/progression";
import { getCurrentTime, getDayKey } from "@/game/logic/time";
import { getBuildingFeatureValue, getBuildingState } from "@/game/data/buildings";
import { upgradeBuilding } from "@/game/logic/buildings";
import { createPlayerCharacter, ensureDefaultCosmetics, equipCosmetic, grantCosmetic, unequipCosmetic } from "@/game/logic/cosmetics";
import { isImportableSave } from "@/game/logic/health";
import type { AutomationPriority, BuildingType, CharacterAppearance, CharacterCosmeticSlot, GameState, OfflineSummary, ResearchId, ToolId, UpgradeId } from "@/game/types";

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
        ? ` · Unternehmenslevel ${newLevel} erreicht · +${settled.researchPointsGained} FP`
        : crossed
          ? ` · Reputation ${crossed} erreicht`
          : "";
    return { state: settled.state, notice: `Reparatur abgenommen · ${settled.profit} € Gewinn${progress}` };
  }), [commit]);

  const purchaseWorkstation = useCallback((workstationId: string) => commit((current) => {
    const workstation = current.workstations.find((item) => item.id === workstationId);
    if (!workstation || workstation.status !== "locked") return { state: current, notice: "Arbeitsplatz ist bereits freigeschaltet" };
    if (current.companyLevel < workstation.requiredLevel) return { state: current, notice: `Unternehmenslevel ${workstation.requiredLevel} benötigt` };
    if (current.reputation < workstation.requiredReputation) return { state: current, notice: `Reputation ${workstation.requiredReputation} benötigt` };
    const workshopCapacity = getBuildingFeatureValue(current, "WORKSHOP", "workstation-capacity");
    if (workstation.index > workshopCapacity) return { state: current, notice: `Workshop Level ${workstation.index} benötigt` };
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
    const employeeCapacity = getBuildingFeatureValue(current, "PERSONNEL", "employee-capacity");
    if (current.employees.length >= employeeCapacity) return { state: current, notice: `Personalzentrum ausgelastet · Kapazität ${employeeCapacity}` };
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

  const setAutomationPriority = useCallback((workstationId: string, priority: AutomationPriority) => commit((current) => {
    if (priority === "fastest-jobs" && !current.researchedNodes.includes("advanced-automation")) return { state: current, notice: "Advanced Automation muss zuerst erforscht werden" };
    return { state: { ...current, workstations: current.workstations.map((item) => item.id === workstationId ? { ...item, automationPriority: priority } : item) }, notice: "Automationspriorität aktualisiert" };
  }), [commit]);

  const purchaseTool = useCallback((toolId: ToolId) => commit((current) => {
    const tool = getTool(toolId);
    if (current.ownedTools.includes(toolId)) return { state: current, notice: `${tool.name} ist bereits vorhanden` };
    const toolTier = (["basic-kit", "multimeter", "soldering-station", "hot-air-station", "microscope"] as ToolId[]).indexOf(toolId) + 1;
    if (toolTier > getBuildingFeatureValue(current, "TOOL_WAREHOUSE", "tool-tier")) return { state: current, notice: `Werkzeuglager-Ausbau für Equipment Tier ${toolTier} benötigt` };
    if (current.reputation < tool.requiredReputation) return { state: current, notice: `Noch ${tool.requiredReputation - current.reputation} Reputation bis ${tool.name}` };
    if (tool.requiredTool && !current.ownedTools.includes(tool.requiredTool)) return { state: current, notice: `Zuerst ${getTool(tool.requiredTool).name} anschaffen` };
    if (current.money < tool.price) return { state: current, notice: `Für ${tool.name} fehlen ${tool.price - current.money} €` };
    const ownedTools = [...current.ownedTools, toolId];
    const context = { ownedTools, reputation: current.reputation, upgrades: current.upgrades, companyLevel: current.companyLevel, researchedNodes: current.researchedNodes };
    const count = getBoardSize(current.upgrades, current.researchedNodes);
    const orders = createOrderBoard(count, current.nextOrderNumber, context);
    const charged = applyTransaction(current, "TOOL_PURCHASE", -tool.price, tool.id, getCurrentTime());
    return { state: { ...charged, ownedTools, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count, nextCustomerNumber: Math.max(current.nextCustomerNumber, current.nextOrderNumber + count) }, notice: `${tool.name} gekauft · neue Reparaturen freigeschaltet` };
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
      const count = getBoardSize(upgrades, current.researchedNodes);
      const orders = createOrderBoard(count, current.nextOrderNumber, context);
      return { state: { ...partial, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count, nextCustomerNumber: Math.max(current.nextCustomerNumber, current.nextOrderNumber + count) }, notice: `${upgrade.name} Level ${level + 1} · Aufträge aktualisiert` };
    }
    const filled = fillOrderBoard(partial, context);
    return { state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber, nextCustomerNumber: filled.nextCustomerNumber }, notice: `${upgrade.name} auf Level ${level + 1} verbessert` };
  }), [commit]);

  const purchaseResearch = useCallback((researchId: ResearchId) => commit((current) => {
    const node = RESEARCH_NODES.find((item) => item.id === researchId);
    if (!node || current.researchedNodes.includes(researchId)) return { state: current, notice: "Forschung bereits abgeschlossen" };
    const researchTier = node.requiredLevel >= 70 ? 3 : node.requiredLevel >= 20 ? 2 : 1;
    if (researchTier > getBuildingFeatureValue(current, "RESEARCH", "research-tier")) return { state: current, notice: `Forschungszentrum Tier ${researchTier} benötigt` };
    if (current.companyLevel < node.requiredLevel) return { state: current, notice: `Unternehmenslevel ${node.requiredLevel} benötigt` };
    if (node.requires.some((required) => !current.researchedNodes.includes(required))) return { state: current, notice: "Vorausgehende Forschung fehlt" };
    if (current.researchPoints < node.cost) return { state: current, notice: `${node.cost - current.researchPoints} Forschungspunkte fehlen` };
    const researchedNodes = [...current.researchedNodes, researchId];
    const offlineCapacityMs = researchId === "offline-operations" ? 12 * 60 * 60 * 1000 : current.offlineCapacityMs;
    const partial = { ...current, researchPoints: current.researchPoints - node.cost, researchedNodes, offlineCapacityMs };
    const filled = fillOrderBoard(partial, getProgressionContext(partial));
    return { state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber, nextCustomerNumber: filled.nextCustomerNumber }, notice: `${node.name} erforscht · ${node.effect}` };
  }), [commit]);

  const claimMilestone = useCallback((milestoneId: string) => commit((current) => {
    const progress = current.milestones.find((item) => item.id === milestoneId);
    const milestone = getMilestone(milestoneId);
    if (!progress || progress.claimed || !milestone) return { state: current, notice: "Meilenstein bereits beansprucht" };
    const rewarded = applyTransaction(current, "MILESTONE_REWARD", milestone.rewardMoney, milestone.id, getCurrentTime());
    const milestones = rewarded.milestones.map((item) => item.id === milestoneId ? { ...item, claimed: true } : item);
    let next = { ...rewarded, researchPoints: rewarded.researchPoints + milestone.rewardResearchPoints, milestones, pendingMilestoneId: milestones.find((item) => !item.claimed)?.id ?? null };
    if (milestone.rewardCosmeticId) next = grantCosmetic(next, milestone.rewardCosmeticId, "PROGRESSION", getCurrentTime()).state;
    return { state: next, notice: `${milestone.name} · Belohnung erhalten${milestone.rewardCosmeticId ? " · Cosmetic freigeschaltet" : ""}` };
  }), [commit]);

  const claimChallenge = useCallback((challengeId: string) => commit((current) => {
    const challenge = [...current.activeChallenges, ...current.dailyChallenges].find((item) => item.id === challengeId);
    if (!challenge?.completed || challenge.claimed) return { state: current, notice: "Challenge ist noch nicht abgeschlossen" };
    const now = getCurrentTime();
    let rewarded = applyTransaction(current, "CHALLENGE_REWARD", challenge.reward.money, challenge.id, now);
    const researchReward=applyFounderBonus(rewarded.playerCharacter?.founderSkill,"research",challenge.reward.researchPoints);
    rewarded = { ...rewarded, reputation: rewarded.reputation + challenge.reward.reputation, researchPoints: rewarded.researchPoints + researchReward, completedChallenges: rewarded.completedChallenges + 1 };
    rewarded = awardCompanyXp(rewarded, challenge.reward.xp, now).state;
    if (challenge.daily) rewarded = { ...rewarded, dailyChallenges: rewarded.dailyChallenges.map((item) => item.id === challengeId ? { ...item, claimed: true } : item) };
    else rewarded = { ...rewarded, activeChallenges: rewarded.activeChallenges.filter((item) => item.id !== challengeId) };
    rewarded = ensureChallenges(rewarded, now, getDayKey(now));
    return { state: rewarded, notice: `${challenge.title} abgeschlossen · Belohnung erhalten` };
  }), [commit]);

  const startMultiDeviceOrder = useCallback((customerId: string) => commit((current) => {
    const result = createMultiDeviceOrder(current, customerId);
    return { state: result.state, notice: result.error ?? "Mehrgeräte-Auftrag angenommen · Einzelreparaturen liegen im Job Board" };
  }), [commit]);

  const takeContract = useCallback((contractId: string) => commit((current) => {
    const result = acceptContract(current, contractId, getCurrentTime());
    return { state: result.state, notice: result.error ?? "Vertrag angenommen" };
  }), [commit]);

  const collectContractReward = useCallback((contractId: string) => commit((current) => {
    const result = claimContract(current, contractId, getCurrentTime());
    return { state: result.state, notice: result.error ?? "Vertrag erfüllt · Bonus verbucht" };
  }), [commit]);

  const purchaseBuildingUpgrade = useCallback((buildingId: BuildingType) => commit((current) => {
    const before = getBuildingState(current, buildingId);
    const result = upgradeBuilding(current, buildingId, getCurrentTime());
    if (result.error) return { state: current, notice: result.error };
    const event = result.state.lastBuildingUpgrade!;
    const visual = event.newVisualTier > event.oldVisualTier ? ` · Visual Tier ${event.newVisualTier}` : "";
    return { state: result.state, notice: `${before.buildingId.replaceAll("_", " ")} Level ${event.newLevel}${visual} · ${event.unlockedFeatures.join(" · ")}` };
  }), [commit]);

  const createFounder = useCallback((name: string, appearance: CharacterAppearance, outfitId: string) => commit((current) => {
    if (current.playerCharacter) return { state: current, notice: "Founder existiert bereits" };
    const now = getCurrentTime();
    const withDefaults = ensureDefaultCosmetics(current, now);
    return { state: { ...withDefaults, playerCharacter: createPlayerCharacter(name, appearance, outfitId, now), cosmeticUnlockNotice: null }, notice: `Founder ${name} erstellt` };
  }), [commit]);

  const equipCharacterCosmetic = useCallback((cosmeticId: string) => commit((current) => {
    const result = equipCosmetic(current, cosmeticId);
    return { state: result.state, notice: result.error ?? "Cosmetic ausgerüstet" };
  }), [commit]);

  const unequipCharacterCosmetic = useCallback((slot: CharacterCosmeticSlot) => commit((current) => ({ state: unequipCosmetic(current, slot), notice: `${slot} entfernt` })), [commit]);

  const updateFounderAppearance = useCallback((appearance: CharacterAppearance) => commit((current) => current.playerCharacter ? { state: { ...current, playerCharacter: { ...current.playerCharacter, appearance } }, notice: "Founder-Aussehen aktualisiert" } : { state: current, notice: "Founder Character fehlt" }), [commit]);

  const importSave = useCallback((json: string) => {
    try {
      const parsed: unknown = JSON.parse(json);
      if (!isImportableSave(parsed)) return "Save-Struktur ist ungültig";
      const migrated = migrateSave(parsed);
      if (!migrated) return "Save konnte nicht migriert werden";
      applyState(migrated);
      setNotice("Spielstand importiert");
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error("Save import failed", error);
      return "JSON konnte nicht gelesen werden";
    }
  }, [applyState]);

  const runDevAction = useCallback((action: "MONEY" | "XP" | "REPUTATION" | "COMPLETE") => commit((current) => {
    if (process.env.NODE_ENV !== "development") return { state: current, notice: "" };
    if (action === "MONEY") return { state: { ...current, money: current.money + 50_000 }, notice: "DEV · 50.000 EUR hinzugefügt" };
    if (action === "REPUTATION") return { state: { ...current, reputation: current.reputation + 50 }, notice: "DEV · 50 Reputation hinzugefügt" };
    if (action === "XP") return { state: awardCompanyXp(current, 5_000, getCurrentTime()).state, notice: "DEV · Company XP hinzugefügt" };
    const now = getCurrentTime();
    return { state: { ...current, workstations: current.workstations.map((station) => station.activeRepair ? { ...station, status: "completed" as const, activeRepair: { ...station.activeRepair, endsAt: now - 1 } } : station) }, notice: "DEV · Aktive Reparaturen abgeschlossen" };
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
    purchaseResearch,
    claimMilestone,
    claimChallenge,
    startMultiDeviceOrder,
    takeContract,
    collectContractReward,
    purchaseBuildingUpgrade,
    createFounder,
    equipCharacterCosmetic,
    unequipCharacterCosmetic,
    updateFounderAppearance,
    importSave,
    runDevAction,
    dismissCosmeticUnlock: () => commit((current) => ({ state: { ...current, cosmeticUnlockNotice: null }, notice: "" })),
    dismissOfflineSummary: () => setOfflineSummary(null),
    purchaseTool,
    purchaseUpgrade,
  };
}

