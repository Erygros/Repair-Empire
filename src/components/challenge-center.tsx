import { CalendarDays, Check, Target, Trophy } from "lucide-react";
import type { Challenge, GameState } from "@/game/types";
import { formatMoney, formatNumber } from "@/utils/format";

function ChallengeCard({ challenge, onClaim }: { challenge: Challenge; onClaim: (id: string) => void }) {
  const percent = Math.min(100, challenge.progress / challenge.target * 100);
  return <article className={`challenge-card ${challenge.completed ? "completed" : ""}`}>
    <div className="challenge-icon">{challenge.completed ? <Check size={18} /> : <Target size={18} />}</div>
    <div className="challenge-copy"><span>{challenge.daily ? "DAILY" : challenge.category.toUpperCase()}</span><h4>{challenge.title}</h4><p>{challenge.description}</p><div className="challenge-progress"><i><b style={{ width: `${percent}%` }} /></i><strong>{formatNumber(Math.floor(challenge.progress))} / {formatNumber(challenge.target)}</strong></div></div>
    <div className="challenge-reward"><span>Belohnung</span><strong>{formatMoney(challenge.reward.money)}</strong><small>{challenge.reward.xp} XP · +{challenge.reward.reputation} Rep.{challenge.reward.researchPoints > 0 ? ` · ${challenge.reward.researchPoints} FP` : ""}</small><button disabled={!challenge.completed || challenge.claimed} onClick={() => onClaim(challenge.id)}>{challenge.claimed ? "Erhalten" : challenge.completed ? "Beanspruchen" : "In Arbeit"}</button></div>
  </article>;
}

export function ChallengeCenter({ state, onClaim }: { state: GameState; onClaim: (id: string) => void }) {
  return <div className="challenge-layout">
    <section><div className="team-section-head"><div><p className="panel-label">ENDLOSE AUFGABEN</p><h3>Aktive Challenges</h3></div><span><Trophy size={17} /> {state.completedChallenges} abgeschlossen</span></div><div className="challenge-list">{state.activeChallenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} onClaim={onClaim} />)}</div></section>
    <section><div className="team-section-head"><div><p className="panel-label">TAGESAUFTRÄGE</p><h3>Daily Tasks</h3></div><span><CalendarDays size={17} /> {state.dailyChallengeDayKey}</span></div><div className="challenge-list">{state.dailyChallenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} onClaim={onClaim} />)}</div></section>
  </div>;
}
