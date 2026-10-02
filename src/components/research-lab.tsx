import { ActiveIcon as Check, ResearchIcon as FlaskConical, ResearchStatusIcon, DiagnosticsIcon, LockedIcon as LockKeyhole } from "@/components/repair-icons";
import { RESEARCH_NODES } from "@/game/data/progression";
import type { GameState, ResearchCategory, ResearchId } from "@/game/types";

const CATEGORIES: ResearchCategory[] = ["Diagnostics", "Repair Technology", "Management", "Automation"];

export function ResearchLab({ state, onResearch }: { state: GameState; onResearch: (id: ResearchId) => void }) {
  return (
    <div className="research-tree">
      <header className="research-header"><div><p className="panel-label">R&D // TECHNOLOGIEBAUM</p><h3>Forschung</h3></div><span><FlaskConical size={17} /> {state.researchPoints} FP verfügbar</span></header>
      <div className="research-columns">
        {CATEGORIES.map((category) => (
          <section className="research-branch" key={category}>
            <h4>{category}</h4>
            {RESEARCH_NODES.filter((node) => node.category === category).map((node) => {
              const researched = state.researchedNodes.includes(node.id);
              const prerequisites = node.requires.every((id) => state.researchedNodes.includes(id));
              const levelReady = state.companyLevel >= node.requiredLevel;
              const affordable = state.researchPoints >= node.cost;
              return (
                <article className={`research-node ${researched ? "researched" : prerequisites && levelReady ? "available" : "locked"}`} key={node.id}>
                  <div className="research-node-icon">{researched ? <Check size={18} /> : prerequisites && levelReady ? category==="Diagnostics" ? <DiagnosticsIcon size="sm"/> : <ResearchStatusIcon size="sm" /> : <LockKeyhole size={17} />}</div>
                  <span className="research-cost">{node.cost} FP</span>
                  <h5>{node.name}</h5><p>{node.description}</p><strong>{node.effect}</strong>
                  <small>Level {node.requiredLevel}{node.requires.length > 0 ? ` · ${node.requires.map((id) => RESEARCH_NODES.find((item) => item.id === id)?.name).join(", ")}` : ""}</small>
                  <button disabled={researched || !prerequisites || !levelReady || !affordable} onClick={() => onResearch(node.id)}>{researched ? "Erforscht" : !levelReady ? `Level ${node.requiredLevel}` : !prerequisites ? "Voraussetzung fehlt" : affordable ? "Erforschen" : `${node.cost - state.researchPoints} FP fehlen`}</button>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
