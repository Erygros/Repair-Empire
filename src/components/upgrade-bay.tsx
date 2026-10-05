import { EfficiencyIcon as Gauge } from "@/components/repair-icons";
import { UpgradeIcon as ArrowUp, ActiveIcon as Check, LockedIcon as LockKeyhole } from "@/components/repair-icons";
import { UPGRADES } from "@/game/data/progression";
import { getUpgradeCost, getUpgradeEffect } from "@/game/logic/game";
import type { UpgradeId, UpgradeLevels } from "@/game/types";
import { formatMoney } from "@/utils/format";

interface UpgradeBayProps {
  money: number;
  reputation: number;
  upgrades: UpgradeLevels;
  onPurchase: (upgradeId: UpgradeId) => void;
}

export function UpgradeBay({ money, reputation, upgrades, onPurchase }: UpgradeBayProps) {
  const totalLevels = Object.values(upgrades).reduce((sum, level) => sum + level, 0);
  return (
    <section className="progression-layout">
      <div className="panel progression-intro upgrade-intro">
        <p className="panel-label">PROZESSKERN // {totalLevels}/25</p>
        <h3>Prozess-Upgrades</h3>
        <div className="upgrade-meter"><span style={{ width: `${(totalLevels / 25) * 100}%` }} /></div>
        <div className="inventory-readout"><Gauge size={18} /><strong>{totalLevels}</strong><span>Prozessstufen aktiv</span></div>
      </div>

      <div className="upgrade-list">
        {UPGRADES.map((upgrade) => {
          const level = upgrades[upgrade.id];
          const maxed = level >= upgrade.maxLevel;
          const locked = reputation < upgrade.requiredReputation;
          const cost = getUpgradeCost(upgrade.id, level);
          const affordable = money >= cost;
          return (
            <article className="upgrade-row" key={upgrade.id}>
              <div className="upgrade-level"><span>LVL</span><strong>{level}</strong><em>/ {upgrade.maxLevel}</em></div>
              <div className="upgrade-copy">
                <h4>{upgrade.name}</h4>
                <p>{upgrade.description}</p>
                <div className="effect-comparison">
                  <span><small>Aktuell</small>{getUpgradeEffect(upgrade.id, level)}</span>
                  <ArrowUp size={15} />
                  <span><small>Nächste Stufe</small>{maxed ? "Maximum erreicht" : getUpgradeEffect(upgrade.id, level + 1)}</span>
                </div>
              </div>
              <div className="level-pips" aria-label={`Level ${level} von ${upgrade.maxLevel}`}>
                {Array.from({ length: upgrade.maxLevel }, (_, index) => <i key={index} className={index < level ? "filled" : ""} />)}
              </div>
              <button className="upgrade-button" disabled={maxed || locked || !affordable} onClick={() => onPurchase(upgrade.id)}>
                {maxed ? <Check size={17} /> : locked ? <LockKeyhole size={16} /> : <ArrowUp size={17} />}
                {maxed ? "Maximum" : locked ? `Rep. ${upgrade.requiredReputation}` : affordable ? formatMoney(cost) : `${formatMoney(cost - money)} fehlen`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

