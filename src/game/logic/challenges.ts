import { ORDER_TEMPLATES } from "@/game/data/orders";
import { PROGRESSION_BALANCE } from "@/game/data/progression";
import type { Challenge, ChallengeCategory, GameState, RepairCategory, RepairOrder, RepairSource } from "@/game/types";

export interface ProgressEvent {
  type: "REPAIR_COMPLETED";
  profit: number;
  reputation: number;
  order: RepairOrder;
  source: RepairSource;
  specializationMatched: boolean;
}

function unit(seed: number) {
  const value = Math.sin(seed * 91.17 + 13.7) * 43758.5453;
  return value - Math.floor(value);
}

function availableCategories(state: GameState) {
  return [...new Set(ORDER_TEMPLATES.filter((order) => state.ownedTools.includes(order.requiredTool) && state.reputation >= order.requiredReputation).map((order) => order.category))];
}

function feasibleCategories(state: GameState): ChallengeCategory[] {
  const values: ChallengeCategory[] = ["repair", "profit", "reputation", "difficulty", "urgent"];
  if (state.employees.length > 0) values.push("specialist");
  if (state.workstations.some((station) => station.automationEnabled && station.assignedEmployeeId)) values.push("automation");
  return values;
}

export function generateChallenge(state: GameState, seed: number, daily: boolean, now: number): Challenge {
  const categories = feasibleCategories(state);
  const category = categories[Math.floor(unit(seed) * categories.length) % categories.length];
  const scale = Math.max(1, Math.sqrt(state.companyLevel));
  const quantity = daily ? Math.max(2, Math.round(2 + scale * 0.55)) : Math.max(4, Math.round(4 + scale * 1.1));
  const rewardScale = daily ? 0.65 : 1;
  let target = quantity;
  let title = "Werkstatt-Routine";
  let description = `Schließe ${target} Reparaturen ab.`;
  let targetCategory: RepairCategory | undefined;
  let targetDifficulty: number | undefined;

  if (category === "profit") { target = Math.round((500 + state.companyLevel * 85) * (daily ? 0.6 : 1)); title = "Profit Sprint"; description = `Erwirtschafte ${target.toLocaleString("de-DE")} EUR Reparaturgewinn.`; }
  if (category === "reputation") { target = Math.max(10, Math.round(12 + state.companyLevel * 1.5)); title = "Guter Ruf"; description = `Verdiene ${target} Reputation durch Reparaturen.`; }
  if (category === "automation") { title = "Automatisierte Schicht"; description = `Schließe ${target} automatisierte Reparaturen ab.`; }
  if (category === "urgent") { target = Math.max(2, Math.ceil(quantity / 3)); title = "Eilaufträge"; description = `Erledige ${target} dringende Aufträge.`; }
  if (category === "specialist") {
    const categoriesAvailable = availableCategories(state);
    targetCategory = categoriesAvailable[Math.floor(unit(seed + 3) * categoriesAvailable.length) % categoriesAvailable.length];
    target = Math.max(2, Math.ceil(quantity / 2));
    title = "Spezialistenarbeit";
    description = `Schließe ${target} passende ${targetCategory}-Reparaturen mit Spezialisten ab.`;
  }
  if (category === "difficulty") {
    const maxDifficulty = Math.max(...ORDER_TEMPLATES.filter((order) => state.ownedTools.includes(order.requiredTool) && state.reputation >= order.requiredReputation).map((order) => order.difficulty), 1);
    targetDifficulty = Math.max(1, Math.min(maxDifficulty, 1 + Math.floor(unit(seed + 5) * maxDifficulty)));
    target = Math.max(2, Math.ceil(quantity / 2));
    title = "Schwierigkeitsprüfung";
    description = `Schließe ${target} Reparaturen der Stufe ${targetDifficulty} ab.`;
  }

  return {
    id: `${daily ? "DAY" : "CH"}-${seed}`,
    seed,
    category,
    title,
    description,
    target,
    progress: 0,
    targetCategory,
    targetDifficulty,
    reward: {
      money: Math.round((120 + target * 24 + state.companyLevel * 12) * rewardScale),
      xp: Math.round((35 + target * 8 + state.companyLevel * 3) * rewardScale),
      reputation: Math.max(2, Math.round((2 + target / 3) * rewardScale)),
      researchPoints: category === "difficulty" || category === "specialist" ? 1 : 0,
    },
    createdAt: now,
    completed: false,
    claimed: false,
    daily,
  };
}

function advance(challenge: Challenge, event: ProgressEvent) {
  if (challenge.completed || challenge.claimed) return challenge;
  let amount = 0;
  if (challenge.category === "repair") amount = 1;
  if (challenge.category === "profit") amount = Math.max(0, event.profit);
  if (challenge.category === "reputation") amount = event.reputation;
  if (challenge.category === "automation" && event.source !== "manual") amount = 1;
  if (challenge.category === "urgent" && event.order.variant === "urgent") amount = 1;
  if (challenge.category === "difficulty" && event.order.difficulty === challenge.targetDifficulty) amount = 1;
  if (challenge.category === "specialist" && event.specializationMatched && event.order.category === challenge.targetCategory) amount = 1;
  const progress = Math.min(challenge.target, challenge.progress + amount);
  return { ...challenge, progress, completed: progress >= challenge.target };
}

export function applyChallengeEvent(state: GameState, event: ProgressEvent) {
  return { ...state, activeChallenges: state.activeChallenges.map((challenge) => advance(challenge, event)), dailyChallenges: state.dailyChallenges.map((challenge) => advance(challenge, event)) };
}

export function ensureChallenges(state: GameState, now: number, dayKey: string) {
  const next = state;
  const active = [...next.activeChallenges];
  let seed = next.nextChallengeSeed;
  while (active.length < PROGRESSION_BALANCE.activeChallengeCount) active.push(generateChallenge(next, seed++, false, now));
  const daily = dayKey === next.dailyChallengeDayKey ? [...next.dailyChallenges] : [];
  while (daily.length < PROGRESSION_BALANCE.dailyChallengeCount) daily.push(generateChallenge(next, seed++, true, now));
  return { ...next, activeChallenges: active, dailyChallenges: daily, dailyChallengeDayKey: dayKey, nextChallengeSeed: seed };
}
