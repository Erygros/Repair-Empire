import { getBuildingFeatureValue, getBuildingState } from "@/game/data/buildings";
import { MARKET_REFRESH_COST, generateCandidateMarket } from "@/game/data/employees";
import { applyFounderBonus } from "@/game/data/founder-skills";
import { getMilestone } from "@/game/data/milestones";
import { REPUTATION_MILESTONES, RESEARCH_NODES, getTool, getUpgrade } from "@/game/data/progression";
import { upgradeBuilding } from "@/game/logic/buildings";
import { ensureChallenges } from "@/game/logic/challenges";
import { acceptContract, claimContract } from "@/game/logic/contracts";
import { grantCosmetic } from "@/game/logic/cosmetics";
import { applyTransaction } from "@/game/logic/economy";
import {
  createMultiDeviceOrder,
  createOrderBoard,
  fillOrderBoard,
  getBoardSize,
  getProgressionContext,
  getRepairLevel,
  getUpgradeCost,
  settleWorkstation,
  startRepairAtWorkstation
} from "@/game/logic/game";
import { awardCompanyXp } from "@/game/logic/progression";
import { getDayKey } from "@/game/logic/time";
import type { AutomationPriority, BuildingType, GameState, ResearchId, ToolId, UpgradeId } from "@/game/types";


export type GameAction =
  | { type: "assignOrder"; orderId: string; workstationId: string }
  | { type: "completeRepair"; workstationId: string }
  | { type: "purchaseWorkstation"; workstationId: string }
  | { type: "hireCandidate"; candidateId: string }
  | { type: "refreshCandidates"; }
  | { type: "assignEmployee"; workstationId: string; employeeId: string | null }
  | { type: "toggleAutomation"; workstationId: string }
  | { type: "setAutomationPriority"; workstationId: string; priority: AutomationPriority }
  | { type: "purchaseTool"; toolId: ToolId }
  | { type: "purchaseUpgrade"; upgradeId: UpgradeId }
  | { type: "purchaseResearch"; researchId: ResearchId }
  | { type: "claimMilestone"; milestoneId: string }
  | { type: "claimChallenge"; challengeId: string }
  | { type: "startMultiDeviceOrder"; customerId: string }
  | { type: "takeContract"; contractId: string }
  | { type: "collectContractReward"; contractId: string }
  | { type: "purchaseBuildingUpgrade"; buildingId: BuildingType };

export function applyGameAction(current: GameState, action: GameAction, now: number): { state: GameState; notice: string } {
  switch (action.type) {
    case "assignOrder": {
      const { orderId, workstationId } = action;

      const started = startRepairAtWorkstation(current, orderId, workstationId, now);
      if (started.error) return { state: current, notice: started.error };
      const station = started.state.workstations.find((item) => item.id === workstationId)!;
      return { state: started.state, notice: `Auftrag an Arbeitsplatz ${station.index} übergeben · Material gebucht` };

    }
    case "completeRepair": {
      const { workstationId } = action;

      const oldLevel = getRepairLevel(current.repairXp);
      const oldReputation = current.reputation;
      const settled = settleWorkstation(current, workstationId, now);
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

    }
    case "purchaseWorkstation": {
      const { workstationId } = action;

      const workstation = current.workstations.find((item) => item.id === workstationId);
      if (!workstation || workstation.status !== "locked") return { state: current, notice: "Arbeitsplatz ist bereits freigeschaltet" };
      if (current.companyLevel < workstation.requiredLevel) return { state: current, notice: `Unternehmenslevel ${workstation.requiredLevel} benötigt` };
      if (current.reputation < workstation.requiredReputation) return { state: current, notice: `Reputation ${workstation.requiredReputation} benötigt` };
      const workshopCapacity = getBuildingFeatureValue(current, "WORKSHOP", "workstation-capacity");
      if (workstation.index > workshopCapacity) return { state: current, notice: `Workshop Level ${workstation.index} benötigt` };
      if (current.money < workstation.purchasePrice) return { state: current, notice: `Für Arbeitsplatz ${workstation.index} fehlen ${workstation.purchasePrice - current.money} €` };
      const previous = current.workstations.find((item) => item.index === workstation.index - 1);
      if (previous?.status === "locked") return { state: current, notice: `Zuerst Arbeitsplatz ${workstation.index - 1} freischalten` };
      const charged = applyTransaction(current, "WORKSTATION_PURCHASE", -workstation.purchasePrice, workstation.id, now);
      return {
        state: { ...charged, workstations: current.workstations.map((item) => item.id === workstationId ? { ...item, status: "available" as const } : item) },
        notice: `Arbeitsplatz ${workstation.index} freigeschaltet`,
      };

    }
    case "hireCandidate": {
      const { candidateId } = action;

      const candidate = current.candidates.find((item) => item.id === candidateId);
      if (!candidate) return { state: current, notice: "Kandidat ist nicht mehr verfügbar" };
      const employeeCapacity = getBuildingFeatureValue(current, "PERSONNEL", "employee-capacity");
      if (current.employees.length >= employeeCapacity) return { state: current, notice: `Personalzentrum ausgelastet · Kapazität ${employeeCapacity}` };
      if (current.money < candidate.hiringCost) return { state: current, notice: `Für ${candidate.name} fehlen ${candidate.hiringCost - current.money} €` };
      const charged = applyTransaction(current, "EMPLOYEE_HIRE", -candidate.hiringCost, candidate.id, now);
      return {
        state: {
          ...charged,
          candidates: current.candidates.filter((item) => item.id !== candidateId),
          employees: [...current.employees, { ...candidate, xp: 0, level: 1, assignedWorkstationId: null, repairsCompleted: 0, revenueGenerated: 0 }],
        },
        notice: `${candidate.name} wurde eingestellt`,
      };

    }
    case "refreshCandidates": {

      if (current.money < MARKET_REFRESH_COST) return { state: current, notice: `Für neue Kandidaten fehlen ${MARKET_REFRESH_COST - current.money} €` };
      const candidates = generateCandidateMarket(current.nextCandidateNumber, current.reputation);
      const charged = applyTransaction(current, "MARKET_REFRESH", -MARKET_REFRESH_COST, "candidate-market", now);
      return {
        state: { ...charged, candidates, nextCandidateNumber: current.nextCandidateNumber + candidates.length },
        notice: "Kandidatenmarkt aktualisiert",
      };

    }
    case "assignEmployee": {
      const { workstationId, employeeId } = action;

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

    }
    case "toggleAutomation": {
      const { workstationId } = action;

      const workstation = current.workstations.find((item) => item.id === workstationId);
      if (!workstation || workstation.index === 1 || !workstation.assignedEmployeeId) return { state: current, notice: "Für Auto Repair wird ein Mitarbeiter benötigt" };
      const enabled = !workstation.automationEnabled;
      return { state: { ...current, workstations: current.workstations.map((item) => item.id === workstationId ? { ...item, automationEnabled: enabled } : item) }, notice: `Auto Repair an Arbeitsplatz ${workstation.index}: ${enabled ? "ON" : "OFF"}` };

    }
    case "setAutomationPriority": {
      const { workstationId, priority } = action;

      if (priority === "fastest-jobs" && !current.researchedNodes.includes("advanced-automation")) return { state: current, notice: "Advanced Automation muss zuerst erforscht werden" };
      return { state: { ...current, workstations: current.workstations.map((item) => item.id === workstationId ? { ...item, automationPriority: priority } : item) }, notice: "Automationspriorität aktualisiert" };

    }
    case "purchaseTool": {
      const { toolId } = action;

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
      const orders = createOrderBoard(count, current.nextOrderNumber, context, now);
      const charged = applyTransaction(current, "TOOL_PURCHASE", -tool.price, tool.id, now);
      return { state: { ...charged, ownedTools, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count, nextCustomerNumber: Math.max(current.nextCustomerNumber, current.nextOrderNumber + count) }, notice: `${tool.name} gekauft · neue Reparaturen freigeschaltet` };

    }
    case "purchaseUpgrade": {
      const { upgradeId } = action;

      const upgrade = getUpgrade(upgradeId);
      const level = current.upgrades[upgradeId];
      const cost = getUpgradeCost(upgradeId, level);
      if (level >= upgrade.maxLevel) return { state: current, notice: `${upgrade.name} ist vollständig ausgebaut` };
      if (current.reputation < upgrade.requiredReputation) return { state: current, notice: `Noch ${upgrade.requiredReputation - current.reputation} Reputation bis ${upgrade.name}` };
      if (current.money < cost) return { state: current, notice: `Für das Upgrade fehlen ${cost - current.money} €` };
      const upgrades = { ...current.upgrades, [upgradeId]: level + 1 };
      const charged = applyTransaction(current, "UPGRADE_PURCHASE", -cost, upgrade.id, now);
      const partial = { ...charged, upgrades };
      const context = getProgressionContext(partial);
      if (upgradeId === "customer-network") {
        const count = getBoardSize(upgrades, current.researchedNodes);
        const orders = createOrderBoard(count, current.nextOrderNumber, context, now);
        return { state: { ...partial, availableOrders: orders, nextOrderNumber: current.nextOrderNumber + count, nextCustomerNumber: Math.max(current.nextCustomerNumber, current.nextOrderNumber + count) }, notice: `${upgrade.name} Level ${level + 1} · Aufträge aktualisiert` };
      }
      const filled = fillOrderBoard(partial, context, now);
      return { state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber, nextCustomerNumber: filled.nextCustomerNumber }, notice: `${upgrade.name} auf Level ${level + 1} verbessert` };

    }
    case "purchaseResearch": {
      const { researchId } = action;

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
      const filled = fillOrderBoard(partial, getProgressionContext(partial), now);
      return { state: { ...partial, availableOrders: filled.orders, nextOrderNumber: filled.nextOrderNumber, nextCustomerNumber: filled.nextCustomerNumber }, notice: `${node.name} erforscht · ${node.effect}` };

    }
    case "claimMilestone": {
      const { milestoneId } = action;

      const progress = current.milestones.find((item) => item.id === milestoneId);
      const milestone = getMilestone(milestoneId);
      if (!progress || progress.claimed || !milestone) return { state: current, notice: "Meilenstein bereits beansprucht" };
      const rewarded = applyTransaction(current, "MILESTONE_REWARD", milestone.rewardMoney, milestone.id, now);
      const milestones = rewarded.milestones.map((item) => item.id === milestoneId ? { ...item, claimed: true } : item);
      let next = { ...rewarded, researchPoints: rewarded.researchPoints + milestone.rewardResearchPoints, milestones, pendingMilestoneId: milestones.find((item) => !item.claimed)?.id ?? null };
      if (milestone.rewardCosmeticId) next = grantCosmetic(next, milestone.rewardCosmeticId, "PROGRESSION", now).state;
      return { state: next, notice: `${milestone.name} · Belohnung erhalten${milestone.rewardCosmeticId ? " · Cosmetic freigeschaltet" : ""}` };

    }
    case "claimChallenge": {
      const { challengeId } = action;

      const challenge = [...current.activeChallenges, ...current.dailyChallenges].find((item) => item.id === challengeId);
      if (!challenge?.completed || challenge.claimed) return { state: current, notice: "Challenge ist noch nicht abgeschlossen" };

      let rewarded = applyTransaction(current, "CHALLENGE_REWARD", challenge.reward.money, challenge.id, now);
      const researchReward = applyFounderBonus(rewarded.playerCharacter?.founderSkill, "research", challenge.reward.researchPoints);
      rewarded = { ...rewarded, reputation: rewarded.reputation + challenge.reward.reputation, researchPoints: rewarded.researchPoints + researchReward, completedChallenges: rewarded.completedChallenges + 1 };
      rewarded = awardCompanyXp(rewarded, challenge.reward.xp, now).state;
      if (challenge.daily) rewarded = { ...rewarded, dailyChallenges: rewarded.dailyChallenges.map((item) => item.id === challengeId ? { ...item, claimed: true } : item) };
      else rewarded = { ...rewarded, activeChallenges: rewarded.activeChallenges.filter((item) => item.id !== challengeId) };
      rewarded = ensureChallenges(rewarded, now, getDayKey(now));
      return { state: rewarded, notice: `${challenge.title} abgeschlossen · Belohnung erhalten` };

    }
    case "startMultiDeviceOrder": {
      const { customerId } = action;

      const result = createMultiDeviceOrder(current, customerId, now);
      return { state: result.state, notice: result.error ?? "Mehrgeräte-Auftrag angenommen · Einzelreparaturen liegen im Job Board" };

    }
    case "takeContract": {
      const { contractId } = action;

      const result = acceptContract(current, contractId, now);
      return { state: result.state, notice: result.error ?? "Vertrag angenommen" };

    }
    case "collectContractReward": {
      const { contractId } = action;

      const result = claimContract(current, contractId, now);
      return { state: result.state, notice: result.error ?? "Vertrag erfüllt · Bonus verbucht" };

    }
    case "purchaseBuildingUpgrade": {
      const { buildingId } = action;

      const before = getBuildingState(current, buildingId);
      const result = upgradeBuilding(current, buildingId, now);
      if (result.error) return { state: current, notice: result.error };
      const event = result.state.lastBuildingUpgrade!;
      const visual = event.newVisualTier > event.oldVisualTier ? ` · Visual Tier ${event.newVisualTier}` : "";
      return { state: result.state, notice: `${before.buildingId.replaceAll("_", " ")} Level ${event.newLevel}${visual} · ${event.unlockedFeatures.join(" · ")}` };

    }
  }
}
