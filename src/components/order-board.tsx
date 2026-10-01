import {
  ArrowRight,
  CircuitBoard,
  Clock3,
  Gamepad2,
  LockKeyhole,
  MonitorSmartphone,
  Radio,
  Smartphone,
  Tablet,
  WalletCards,
} from "lucide-react";
import { getTool } from "@/game/data/progression";
import { canAccessOrder } from "@/game/logic/game";
import type { DeviceKind, RepairOrder, ToolId, UpgradeLevels } from "@/game/types";
import { formatMoney } from "@/utils/format";

const DEVICE_ICONS: Record<DeviceKind, typeof Smartphone> = {
  Smartphone,
  Controller: Gamepad2,
  Handheld: MonitorSmartphone,
  "Game Console": CircuitBoard,
  Tablet,
  "Audio Deck": Radio,
};

interface OrderBoardProps {
  orders: RepairOrder[];
  money: number;
  reputation: number;
  ownedTools: ToolId[];
  upgrades: UpgradeLevels;
  onAccept: (orderId: string) => void;
}

export function OrderBoard({ orders, money, reputation, ownedTools, upgrades, onAccept }: OrderBoardProps) {
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
          const title = missingTool
              ? `${getTool(order.requiredTool).name} fehlt`
              : reputation < order.requiredReputation
                ? `Reputation ${order.requiredReputation} benötigt`
                : !enoughMoney
                  ? "Nicht genug Geld für Material"
                  : "Auftrag annehmen";

          return (
            <article className={`order-row ${locked ? "is-locked" : ""}`} key={order.id}>
              <div className="device-icon" aria-hidden="true">{locked ? <LockKeyhole size={19} /> : <DeviceIcon size={21} />}</div>
              <div className="order-main">
                <div className="order-meta">
                  <span>{order.id}</span>
                  {order.urgency === "express" && <em>Express</em>}
                  {locked && <em className="locked-tag">Gesperrt</em>}
                </div>
                <h4>{order.device}</h4>
                <p>{order.issue}</p>
                <div className="order-specs">
                  <span><Clock3 size={13} /> {order.durationSeconds} Sek.</span>
                  <span>Stufe {order.difficulty}</span>
                  <span><WalletCards size={13} /> {formatMoney(order.materialCost)}</span>
                  <strong>{formatMoney(order.reward)}</strong>
                </div>
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

