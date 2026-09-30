import { ArrowRight, Clock3, Smartphone, Gamepad2, MonitorSmartphone, CircuitBoard } from "lucide-react";
import type { DeviceKind, RepairOrder } from "@/game/types";
import { formatMoney } from "@/utils/format";

const DEVICE_ICONS: Record<DeviceKind, typeof Smartphone> = {
  Smartphone,
  Controller: Gamepad2,
  Handheld: MonitorSmartphone,
  "Game Console": CircuitBoard,
};

interface OrderBoardProps {
  orders: RepairOrder[];
  benchOccupied: boolean;
  onAccept: (orderId: string) => void;
}

export function OrderBoard({ orders, benchOccupied, onAccept }: OrderBoardProps) {
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
          return (
            <article className="order-row" key={order.id}>
              <div className="device-icon" aria-hidden="true"><DeviceIcon size={21} /></div>
              <div className="order-main">
                <div className="order-meta">
                  <span>{order.id}</span>
                  {order.urgency === "express" && <em>Express</em>}
                </div>
                <h4>{order.device}</h4>
                <p>{order.issue}</p>
                <div className="order-specs">
                  <span><Clock3 size={13} /> {order.durationSeconds} Sek.</span>
                  <span>Stufe {order.difficulty}</span>
                  <strong>{formatMoney(order.reward)}</strong>
                </div>
              </div>
              <button
                className="accept-button"
                onClick={() => onAccept(order.id)}
                disabled={benchOccupied}
                aria-label={`${order.device} Auftrag annehmen`}
                title={benchOccupied ? "Arbeitsplatz ist belegt" : "Auftrag annehmen"}
              >
                <ArrowRight size={19} />
              </button>
            </article>
          );
        })}
      </div>
      {benchOccupied && <p className="board-note">Neue Annahme möglich, sobald Werkbank 01 frei ist.</p>}
    </section>
  );
}

