import { getReachedMilestones } from "@/game/data/milestones";
import { getCompanyLevel, getCompanyLevelProgress, getResearchPointsForLevels } from "@/game/data/progression";
import type { GameState } from "@/game/types";

export function awardCompanyXp(state: GameState, amount: number, now: number) {
  const oldLevel = state.companyLevel;
  const lifetimeXp = Math.max(0, state.lifetimeXp + Math.max(0, Math.round(amount)));
  const companyLevel = getCompanyLevel(lifetimeXp);
  const progress = getCompanyLevelProgress(lifetimeXp);
  const researchPointsGained = getResearchPointsForLevels(oldLevel, companyLevel);
  const existing = new Set(state.milestones.map((milestone) => milestone.id));
  const reached = getReachedMilestones(oldLevel, companyLevel).filter((milestone) => !existing.has(milestone.id));
  return {
    state: {
      ...state,
      repairXp: lifetimeXp,
      lifetimeXp,
      companyLevel,
      currentLevelXp: progress.current,
      researchPoints: state.researchPoints + researchPointsGained,
      milestones: [...state.milestones, ...reached.map((milestone) => ({ id: milestone.id, completedAt: now, claimed: false }))],
      pendingMilestoneId: state.pendingMilestoneId ?? reached[0]?.id ?? null,
    },
    levelsGained: companyLevel - oldLevel,
    researchPointsGained,
  };
}
