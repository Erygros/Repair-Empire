import { BriefcaseBusiness, RefreshCw, Zap } from "lucide-react";
import { LevelUpIcon as Star, EmployeesIcon as UserPlus, EmployeesIcon as UsersRound } from "@/components/repair-icons";
import { MARKET_REFRESH_COST } from "@/game/data/employees";
import { getEmployeeLevelProgress } from "@/game/logic/game";
import type { Employee, EmployeeCandidate, GameState } from "@/game/types";
import { formatMoney } from "@/utils/format";

function StatLine({ person }: { person: Employee | EmployeeCandidate }) {
  return <div className="person-stats"><span><Zap size={13} /> {person.speed.toFixed(2)}x</span><span>Skill {person.skill}</span><span>Qualität {person.quality}</span></div>;
}

export function TeamHub({ state, onHire, onRefresh }: { state: GameState; onHire: (id: string) => void; onRefresh: () => void }) {
  return (
    <div className="team-layout">
      <section className="team-market">
        <div className="team-section-head"><div><p className="panel-label">BEWERBERNETZ // LIVE</p><h3>Mitarbeitermarkt</h3></div><button onClick={onRefresh} disabled={state.money < MARKET_REFRESH_COST}><RefreshCw size={15} /> Aktualisieren · {formatMoney(MARKET_REFRESH_COST)}</button></div>
        <div className="candidate-grid">
          {state.candidates.map((candidate) => (
            <article className="candidate-card" key={candidate.id}>
              <div className="candidate-avatar">{candidate.name.split(" ").map((part) => part[0]).join("")}</div>
              <span className="candidate-class">{candidate.class}</span>
              <h4>{candidate.name}</h4>
              <p><BriefcaseBusiness size={13} /> {candidate.specialization}</p>
              <StatLine person={candidate} />
              <button disabled={state.money < candidate.hiringCost} onClick={() => onHire(candidate.id)}><UserPlus size={16} /> {state.money >= candidate.hiringCost ? `Einstellen · ${formatMoney(candidate.hiringCost)}` : `${formatMoney(candidate.hiringCost - state.money)} fehlen`}</button>
            </article>
          ))}
          {state.candidates.length === 0 && <div className="empty-candidates"><UsersRound size={24} /><strong>Markt leer</strong><span>Aktualisiere den Kandidatenpool.</span></div>}
        </div>
      </section>

      <section className="roster-section">
        <div className="team-section-head"><div><p className="panel-label">TEAM // {state.employees.length}</p><h3>Eingestellte Techniker</h3></div></div>
        {state.employees.length === 0 ? (
          <div className="empty-roster"><UsersRound size={28} /><strong>Noch ein Ein-Mann-Betrieb</strong><span>Stelle den ersten Techniker ein, um eine weitere Station zu betreiben.</span></div>
        ) : (
          <div className="roster-list">
            {state.employees.map((employee) => {
              const progress = getEmployeeLevelProgress(employee.xp);
              const station = state.workstations.find((item) => item.id === employee.assignedWorkstationId);
              return (
                <article className="employee-row" key={employee.id}>
                  <div className="employee-rank"><span>LVL</span><strong>{employee.level}</strong></div>
                  <div className="employee-main"><h4>{employee.name}</h4><p>{employee.class} · {employee.specialization}</p><StatLine person={employee} /><div className="employee-xp"><span style={{ width: `${progress.percent}%` }} /></div><small>{progress.current}/{progress.required} XP</small></div>
                  <div className="employee-assignment"><Star size={15} /><span>{station ? `Arbeitsplatz ${station.index}` : "Nicht zugewiesen"}</span></div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

