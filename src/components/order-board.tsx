import {
  ArrowRight,
  CircuitBoard,
  Clock3,
  Gamepad2,
  LockKeyhole,
  Laptop,
  MonitorSmartphone,
  Radio,
  Smartphone,
  Tablet,
  WalletCards,
} from "lucide-react";
import { DIFFICULTY_LABELS } from "@/game/data/orders";
import { getTool } from "@/game/data/progression";
import { canAccessOrder, getJobEconomy } from "@/game/logic/game";
import type { DeviceKind, RepairOrder, ToolId, UpgradeLevels } from "@/game/types";
import { formatClock, formatMoney } from "@/utils/format";

const DEVICE_ICONS: Record<DeviceKind, typeof Smartphone> = {
  Smartphone,
  Controller: Gamepad2,
  Handheld: MonitorSmartphone,
  "Game Console": CircuitBoard,
  Tablet,
  Laptop,
  "Audio Deck": Radio,
};

interface OrderBoardProps {
  orders: RepairOrder[];
  money: number;
  reputation: number;
  ownedTools: ToolId[];
  upgrades: UpgradeLevels;
  now: number;
  onAccept: (orderId: string) => void;
}

export function OrderBoard({ orders, money, reputation, ownedTools, upgrades, now, onAccept }: OrderBoardProps) {
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
          const DeviceIcon = DEVICE_ICONS[order.device];
          const accessible = canAccessOrder(order, { ownedTools, reputation, upgrades });
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
              <div className="device-icon" aria-hidden="true">{locked ? <LockKeyhole size={19} /> : <DeviceIcon size={21} />}</div>
              <div className="order-main">
                <div className="order-meta">
                  <span>{order.id}</span>
                  {order.variant === "urgent" && <em className="urgent-tag">Dringend · {formatClock((order.expiresAt ?? now) - now)}</em>}
                  {order.variant === "premium" && <em className="premium-tag">Premium</em>}
                  {order.variant === "complex" && <em>Komplex</em>}
                  {locked && <em className="locked-tag">Gesperrt</em>}
                </div>
                <h4>{order.device}</h4>
                <p>{order.issue}</p>
                <div className="order-specs">
                  <span><Clock3 size={13} /> {economy.durationSeconds} Sek.</span>
                  <span>{DIFFICULTY_LABELS[order.difficulty]}</span>
                  <span><WalletCards size={13} /> Kosten {formatMoney(order.materialCost)}</span>
                  <strong>Gewinn {formatMoney(economy.estimatedProfit)}</strong>
                </div>
                <div className="order-economy"><span>Umsatz {formatMoney(order.reward)}</span><span>{formatMoney(economy.profitPerMinute)}/Min.</span><span>Skill {order.skillRequirement}</span></div>
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

