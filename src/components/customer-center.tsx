import { BriefcaseBusiness, Building2, Check, PackageCheck, Repeat2, UsersRound } from "lucide-react";
import { CUSTOMER_TYPE_CONFIG } from "@/game/data/customers";
import { getActiveContractLimit } from "@/game/logic/contracts";
import type { GameState } from "@/game/types";
import { formatClock, formatMoney } from "@/utils/format";

export function CustomerCenter({ state, now, onAcceptContract, onClaimContract, onCreateMultiOrder }: { state: GameState; now: number; onAcceptContract: (id: string) => void; onClaimContract: (id: string) => void; onCreateMultiOrder: (id: string) => void }) {
  const activeCount = state.contracts.filter((contract) => contract.status === "active").length;
  return (
    <div className="customer-layout">
      <section className="panel customer-contracts">
        <div className="panel-header"><div><p className="panel-label">KEY ACCOUNTS // VERTRÄGE</p><h3>Vertragsmanagement</h3></div><span className="count-badge">{activeCount}/{getActiveContractLimit(state)}</span></div>
        <div className="contract-list">
          {state.contractOffers.map((contract) => <article key={contract.id}><BriefcaseBusiness size={20} /><div><span>{contract.customerName} · Angebot</span><h4>{contract.title}</h4><p>{contract.description}</p><small>Bonus {formatMoney(contract.reward.money)} · {contract.reward.xp} XP · {contract.reward.reputation} Rep.</small></div><button onClick={() => onAcceptContract(contract.id)} disabled={activeCount >= getActiveContractLimit(state)}>Annehmen</button></article>)}
          {state.contracts.filter((contract) => ["active", "completed"].includes(contract.status)).map((contract) => <article key={contract.id} className={contract.status}><BriefcaseBusiness size={20} /><div><span>{contract.customerName} · {contract.type.replaceAll("_", " ")}</span><h4>{contract.title}</h4><p>{contract.progress}/{contract.target} · {contract.expiresAt ? formatClock(contract.expiresAt - now) : "ohne Frist"}</p><i><b style={{ width: `${contract.progress / contract.target * 100}%` }} /></i><small>Bonus {formatMoney(contract.reward.money)}</small></div>{contract.status === "completed" && <button onClick={() => onClaimContract(contract.id)}><Check size={15} /> Bonus</button>}</article>)}
          {state.contractOffers.length === 0 && !state.contracts.some((contract) => ["active", "completed"].includes(contract.status)) && <p className="empty-state">Geschäftskunden bieten nach erfolgreichen Reparaturen passende Verträge an.</p>}
        </div>
      </section>

      <section className="panel customer-directory">
        <div className="panel-header"><div><p className="panel-label">CRM // BEZIEHUNGEN</p><h3>Stammkunden</h3></div><UsersRound size={19} /></div>
        <div className="customer-list">
          {state.persistentCustomers.map((customer) => {
            const canMulti = ["SMALL_BUSINESS", "RETAILER", "CORPORATE"].includes(customer.customerType) && !state.multiDeviceOrders.some((order) => order.customerId === customer.id && order.status === "active");
            return <article key={customer.id}><div className="customer-avatar"><Building2 size={19} /></div><div><span>{CUSTOMER_TYPE_CONFIG[customer.customerType].label} · {customer.relationshipState}</span><h4>{customer.displayName}</h4><p>{customer.preferredDeviceCategories.join(" · ")}</p><small><Repeat2 size={12} /> {customer.successfulJobs} Jobs · Loyalty {customer.loyalty}/100 · {formatMoney(customer.totalRevenueGenerated)}</small></div>{canMulti && <button title="Mehrgeräte-Auftrag anfragen" onClick={() => onCreateMultiOrder(customer.id)}><PackageCheck size={16} /></button>}</article>;
          })}
          {state.persistentCustomers.length === 0 && <p className="empty-state">Wiederkehrende und geschäftlich relevante Kunden erscheinen hier.</p>}
        </div>
      </section>

      <section className="panel multi-orders">
        <div className="panel-header"><div><p className="panel-label">SERIENAUFTRÄGE // PIPELINE</p><h3>Mehrgeräte-Aufträge</h3></div><PackageCheck size={19} /></div>
        {state.multiDeviceOrders.slice(0, 8).map((order) => <article key={order.orderId}><div><span>{order.orderId} · {order.customerName}</span><strong>{order.completedItems}/{order.totalItems} Geräte</strong></div><i><b style={{ width: `${order.completedItems / order.totalItems * 100}%` }} /></i><small>{formatMoney(order.totalRevenue)} Umsatz · {formatMoney(order.estimatedTotalMaterialCost)} Material</small></article>)}
        {state.multiDeviceOrders.length === 0 && <p className="empty-state">Serienaufträge werden bei geeigneten Geschäftskunden gestartet.</p>}
      </section>
    </div>
  );
}
