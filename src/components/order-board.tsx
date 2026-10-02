import { PremiumIcon, DeviceIcon } from "@/components/repair-icons";
import { ArrowRight, Clock3 } from "lucide-react";
import { LockedIcon as LockKeyhole, CapitalIcon as WalletCards } from "@/components/repair-icons";
import { DIFFICULTY_LABELS } from "@/game/data/orders";
import { getTool } from "@/game/data/progression";
import { canAccessOrder, getJobEconomy } from "@/game/logic/game";
import type { RepairOrder, ResearchId, ToolId, UpgradeLevels } from "@/game/types";
import { formatClock, formatMoney } from "@/utils/format";
import { CUSTOMER_TYPE_CONFIG } from "@/game/data/customers";

interface OrderBoardProps {
  orders: RepairOrder[];
  money: number;
  reputation: number;
  ownedTools: ToolId[];
  upgrades: UpgradeLevels;
  researchedNodes: ResearchId[];
  now: number;
  onAccept: (orderId: string) => void;
}

export function OrderBoard({ orders, money, reputation, ownedTools, upgrades, researchedNodes, now, onAccept }: OrderBoardProps) {
  return (
    <section className="panel orders-panel">
      <div className="panel-header">
        <div>
          <p className="panel-label">EINGANG // LIVE</p>
          <h3>Verfügbare Aufträge</h3>
        </div>
        <span className="count-badge">{orders.length}</span>
      </div>

      <div className="order-list">
        {orders.map((order) => {
          const accessible = canAccessOrder(order, { ownedTools, reputation, upgrades, companyLevel: 1, researchedNodes });
          const enoughMoney = money >= order.materialCost;
          const missingTool = !ownedTools.includes(order.requiredTool);
          const locked = !accessible;
          const disabled = locked || !enoughMoney;
          const economy = getJobEconomy(order, upgrades);
          const title = missingTool
              ? `${getTool(order.requiredTool).name} fehlt`
              : reputation < order.requiredReputation
                ? `Reputation ${order.requiredReputation} benötigt`
                : !enoughMoney
                  ? "Nicht genug Geld für Material"
                  : "Auftrag annehmen";

          return (
            <article className={`order-row variant-${order.variant} ${locked ? "is-locked" : ""}`} key={order.id}>
              <div className="device-icon" aria-hidden="true"><DeviceIcon kind={order.device} size="md"/></div>
              <div className="order-main">
                <div className="order-meta">
                  <span>{order.id}</span>
                  {order.variant === "urgent" && <em className="urgent-tag">Dringend · {formatClock((order.expiresAt ?? now) - now)}</em>}
                  {order.variant === "premium" && <em className="premium-tag"><PremiumIcon size="xs"/> Premium</em>}
                  {order.variant === "complex" && <em>Komplex</em>}
                  {locked && <em className="locked-tag">Gesperrt</em>}
                </div>
                <h4>{order.device}</h4>
                <p>{order.issue}</p>
                <div className="order-customer"><span>{order.customer}</span><em>{CUSTOMER_TYPE_CONFIG[order.customerType].label}{order.returningCustomer ? " · Stammkunde" : ""}{order.multiDeviceOrderId ? ` · ${order.multiDeviceOrderId}` : ""}</em></div>
                <div className="order-specs">
                  <span><Clock3 size={13} /> {economy.durationSeconds} Sek.</span>
                  <span>{DIFFICULTY_LABELS[order.difficulty]}</span>
                  <span><WalletCards size={13} /> Kosten {formatMoney(order.materialCost)}</span>
                  <strong>Gewinn {formatMoney(economy.estimatedProfit)}</strong>
                </div>
                {researchedNodes.includes("basic-diagnostics") && <p className="order-diagnostic">{order.diagnostic}</p>}
                <div className="order-economy"><span>Umsatz {formatMoney(order.reward)}</span>{researchedNodes.includes("job-analysis") && <span>{formatMoney(economy.profitPerMinute)}/Min.</span>}{researchedNodes.includes("advanced-diagnostics") && <span>Skill {order.skillRequirement}</span>}</div>
                {locked && (
                  <div className="lock-reason">
                    {missingTool ? `${getTool(order.requiredTool).name} fehlt` : `Reputation ${order.requiredReputation} benötigt`}
                    <span>Potenzial {formatMoney(order.reward)}</span>
                  </div>
                )}
              </div>
              <button
                className="accept-button"
                onClick={() => onAccept(order.id)}
                disabled={disabled}
                aria-label={`${order.device} Auftrag annehmen`}
                title={title}
              >
                {locked ? <LockKeyhole size={16} /> : <ArrowRight size={19} />}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

