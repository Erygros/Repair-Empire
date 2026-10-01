export interface MilestoneDefinition {
  id: string;
  level: number;
  chapter: string;
  name: string;
  description: string;
  unlock: string;
  rewardMoney: number;
  rewardResearchPoints: number;
  presentation: "chapter" | "major";
  rewardCosmeticId?: string;
}

export const MILESTONES: MilestoneDefinition[] = [
  { id: "chapter-1", level: 60, chapter: "Kapitel I abgeschlossen", name: "Die kleine Werkstatt", description: "Dein Betrieb ist bereit für die erste große Erweiterung.", unlock: "Werkbank 2", rewardMoney: 1_500, rewardResearchPoints: 3, rewardCosmeticId: "outfit-orange-jacket", presentation: "chapter" },
  { id: "workshop-expansion", level: 150, chapter: "Expansion", name: "Regionaler Reparaturbetrieb", description: "Die nächste Produktionsstufe wird verfügbar.", unlock: "Werkbank 3", rewardMoney: 5_000, rewardResearchPoints: 5, presentation: "major" },
  { id: "professional-workshop", level: 300, chapter: "Professional Workshop", name: "Industrielle Werkstatt", description: "Dein Unternehmen erreicht professionellen Maßstab.", unlock: "Werkbank 4", rewardMoney: 15_000, rewardResearchPoints: 8, presentation: "major" },
];

export function getNextMilestone(level: number) {
  const handcrafted = MILESTONES.find((milestone) => milestone.level > level);
  if (handcrafted) return handcrafted;
  const generatedLevel = Math.floor(level / 100 + 1) * 100;
  return { id: `empire-${generatedLevel}`, level: generatedLevel, chapter: "Empire Milestone", name: `Unternehmenslevel ${generatedLevel}`, description: "Langfristiger Wachstumsschritt deines Repair Empire.", unlock: "Langzeitbelohnung", rewardMoney: generatedLevel * 75, rewardResearchPoints: Math.max(2, Math.floor(generatedLevel / 100)), presentation: "major" as const };
}

export function getMilestone(id: string) {
  const handcrafted = MILESTONES.find((milestone) => milestone.id === id);
  if (handcrafted) return handcrafted;
  const level = Number(id.replace("empire-", ""));
  return Number.isFinite(level) && level >= 400
    ? { id, level, chapter: "Empire Milestone", name: `Unternehmenslevel ${level}`, description: "Langfristiger Wachstumsschritt deines Repair Empire.", unlock: "Langzeitbelohnung", rewardMoney: level * 75, rewardResearchPoints: Math.max(2, Math.floor(level / 100)), presentation: "major" as const }
    : null;
}

export function getReachedMilestones(fromLevel: number, toLevel: number) {
  const reached: MilestoneDefinition[] = MILESTONES.filter((milestone) => milestone.level > fromLevel && milestone.level <= toLevel);
  for (let level = 400; level <= toLevel; level += 100) {
    if (level <= fromLevel) continue;
    reached.push({ id: `empire-${level}`, level, chapter: "Empire Milestone", name: `Unternehmenslevel ${level}`, description: "Langfristiger Wachstumsschritt deines Repair Empire.", unlock: "Langzeitbelohnung", rewardMoney: level * 75, rewardResearchPoints: Math.max(2, Math.floor(level / 100)), presentation: "major" });
  }
  return reached;
}
