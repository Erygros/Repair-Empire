import { Flag } from "lucide-react";
import { ResearchIcon as FlaskConical, XpIcon, CompanyLevelIcon } from "@/components/repair-icons";
import { getNextMilestone } from "@/game/data/milestones";
import { getCompanyLevelProgress } from "@/game/data/progression";
import type { GameState } from "@/game/types";
import { formatNumber } from "@/utils/format";

export function ProgressionStrip({ state }: { state: GameState }) {
  const progress = getCompanyLevelProgress(state.lifetimeXp);
  const milestone = getNextMilestone(state.companyLevel);
  const milestoneStart = milestone.level <= 60 ? 1 : milestone.level === 150 ? 60 : milestone.level === 300 ? 150 : milestone.level - 100;
  const milestonePercent = Math.min(100, Math.max(0, ((state.companyLevel - milestoneStart) / (milestone.level - milestoneStart)) * 100));
  return (
    <section className="progression-strip">
      <div className="company-level"><span><CompanyLevelIcon size="sm"/>Unternehmenslevel</span><strong>{formatNumber(state.companyLevel)}</strong></div>
      <div className="level-xp"><div><span><XpIcon size="xs"/>{formatNumber(progress.current)} / {formatNumber(progress.required)} XP</span><em>{progress.percent.toFixed(1)} %</em></div><i><b style={{ width: `${progress.percent}%` }} /></i></div>
      <div className="next-milestone"><Flag size={17} /><span>Nächster Meilenstein<strong>{milestone.unlock} · Level {formatNumber(milestone.level)}</strong></span><i><b style={{ width: `${milestonePercent}%` }} /></i></div>
      <div className="research-readout"><FlaskConical size={17} /><span>Forschungspunkte</span><strong>{state.researchPoints}</strong></div>
    </section>
  );
}
