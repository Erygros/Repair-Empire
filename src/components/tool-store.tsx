import { EfficiencyIcon as Gauge, ShopIcon as ShoppingCart } from "@/components/repair-icons";
import { ActiveIcon as Check, LockedIcon as LockKeyhole, ToolsIcon as Wrench } from "@/components/repair-icons";
import { TOOLS, getTool } from "@/game/data/progression";
import type { ToolId } from "@/game/types";
import { formatMoney } from "@/utils/format";

interface ToolStoreProps {
  money: number;
  reputation: number;
  ownedTools: ToolId[];
  onPurchase: (toolId: ToolId) => void;
}

export function ToolStore({ money, reputation, ownedTools, onPurchase }: ToolStoreProps) {
  return (
    <section className="progression-layout">
      <div className="panel progression-intro">
        <p className="panel-label">WERKZEUGLAGER // TIER {ownedTools.length}</p>
        <h3>Neue Fähigkeiten liegen nicht im Menü. Sie liegen auf der Werkbank.</h3>
        <p>Jedes Werkzeug öffnet eine neue Reparaturklasse. Reputation und Vorgängergerät sichern den kontrollierten Ausbau.</p>
        <div className="tier-track" aria-label={`${ownedTools.length} von ${TOOLS.length} Werkzeugen vorhanden`}>
          {TOOLS.map((tool, index) => <span key={tool.id} className={index < ownedTools.length ? "filled" : ""} />)}
        </div>
        <div className="inventory-readout"><Wrench size={18} /><strong>{ownedTools.length}/{TOOLS.length}</strong><span>Werkzeugstufen aktiv</span></div>
      </div>

      <div className="tool-grid">
        {TOOLS.map((tool, index) => {
          const owned = ownedTools.includes(tool.id);
          const reputationLocked = reputation < tool.requiredReputation;
          const prerequisiteLocked = Boolean(tool.requiredTool && !ownedTools.includes(tool.requiredTool));
          const locked = reputationLocked || prerequisiteLocked;
          const affordable = money >= tool.price;
          const status = owned ? "Vorhanden" : locked ? "Noch gesperrt" : "Kaufbar";
          return (
            <article className={`equipment-card ${owned ? "is-owned" : ""}`} key={tool.id}>
              <div className="equipment-index">T{index + 1}</div>
              <div className="equipment-head">
                <div className="equipment-icon">{owned ? <Check size={21} /> : locked ? <LockKeyhole size={20} /> : <Gauge size={20} />}</div>
                <span className={`equipment-status ${owned ? "owned" : locked ? "locked" : "available"}`}>{status}</span>
              </div>
              <h4>{tool.name}</h4>
              <p>{tool.description}</p>
              <div className="unlock-list">
                <span>Schaltet frei</span>
                {tool.unlocks.map((unlock) => <strong key={unlock}>{unlock}</strong>)}
              </div>
              {!owned && locked && (
                <p className="requirement-line">
                  {reputationLocked ? `Reputation ${tool.requiredReputation}` : `${getTool(tool.requiredTool!).name} benötigt`}
                </p>
              )}
              <button className="purchase-button" disabled={owned || locked || !affordable} onClick={() => onPurchase(tool.id)}>
                {owned ? <Check size={17} /> : <ShoppingCart size={17} />}
                {owned
                  ? "Installiert"
                  : reputationLocked
                    ? `Reputation ${tool.requiredReputation}`
                    : prerequisiteLocked
                      ? `${getTool(tool.requiredTool!).name} fehlt`
                      : affordable
                        ? formatMoney(tool.price)
                        : `${formatMoney(tool.price - money)} fehlen`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

