import { Flag, Trophy } from "lucide-react";
import { getMilestone } from "@/game/data/milestones";
import type { GameState } from "@/game/types";
import { formatMoney } from "@/utils/format";

export function MilestoneReport({ state, onClaim }: { state: GameState; onClaim: (id: string) => void }) {
  const milestone = state.pendingMilestoneId ? getMilestone(state.pendingMilestoneId) : null;
  if (!milestone) return null;
  return <div className="dock-backdrop"><section className="milestone-report" role="dialog" aria-modal="true" aria-labelledby="milestone-title"><Trophy size={34} /><p className="panel-label">{milestone.chapter}</p><h3 id="milestone-title">{milestone.name}</h3><strong className="milestone-level">Unternehmenslevel {milestone.level}</strong><p>{milestone.description}</p><div className="milestone-unlock"><Flag size={18} /><span>Neue Erweiterung<strong>{milestone.unlock}</strong></span></div><div className="milestone-rewards"><span>{formatMoney(milestone.rewardMoney)}</span><span>+{milestone.rewardResearchPoints} Forschungspunkte</span></div><button onClick={() => onClaim(milestone.id)}>Meilenstein beanspruchen</button></section></div>;
}
