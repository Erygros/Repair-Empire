import { ReceiptText } from "lucide-react";
import { CapitalIcon, RepairsIcon } from "@/components/repair-icons";
import type { GameState, RepairCategory } from "@/game/types";
import { formatMoney, formatTime } from "@/utils/format";

const CATEGORY_LABELS: Record<RepairCategory, string> = {
  "Mobile Devices": "Mobile",
  Consoles: "Konsolen",
  Computers: "Computer",
  Electronics: "Elektronik",
};

export function EconomyDashboard({ state }: { state: GameState }) {
  const daily = state.dailyStats;
  const stats = state.lifetimeStats;
  const averageProfit = daily.repairsCompleted > 0 ? daily.profit / daily.repairsCompleted : 0;
  const topEmployee = [...state.employees].sort((a, b) => b.revenueGenerated - a.revenueGenerated)[0];
  const topCategory = (Object.entries(stats.categoryProfit) as [RepairCategory, number][]).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="economy-layout">
      <section className="economy-kpis">
        <article><CapitalIcon size={24} /><span>Heutiger Umsatz</span><strong>{formatMoney(daily.revenue)}</strong></article>
        <article><CapitalIcon size={24} /><span>Heutige Kosten</span><strong>{formatMoney(daily.materialCosts + daily.operatingCosts)}</strong></article>
        <article className="profit-kpi"><CapitalIcon size={24} /><span>Heutiger Gewinn</span><strong>{formatMoney(daily.profit)}</strong></article>
        <article><RepairsIcon size={24} /><span>Reparaturen heute</span><strong>{daily.repairsCompleted}</strong></article>
        <article><CapitalIcon size={24} /><span>Ø Gewinn / Auftrag</span><strong>{formatMoney(averageProfit)}</strong></article>
      </section>

      <div className="economy-detail-grid">
        <section className="panel lifetime-panel">
          <div className="panel-header"><div><p className="panel-label">UNTERNEHMEN // LIFETIME</p><h3>Gesamtbilanz</h3></div></div>
          <dl className="balance-list">
            <div><dt>Umsatz</dt><dd>{formatMoney(stats.totalRevenue)}</dd></div>
            <div><dt>Materialkosten</dt><dd>-{formatMoney(stats.totalMaterialCosts)}</dd></div>
            <div><dt>Betriebskosten</dt><dd>-{formatMoney(stats.totalOperatingCosts)}</dd></div>
            <div className="balance-profit"><dt>Gesamtgewinn</dt><dd>{formatMoney(stats.totalProfit)}</dd></div>
          </dl>
          <div className="company-highlights">
            <span>Manuell<strong>{stats.manualRepairs}</strong></span><span>Auto<strong>{stats.automatedRepairs}</strong></span><span>Offline<strong>{stats.offlineRepairs}</strong></span>
            <span>Top-Techniker<strong>{topEmployee?.name ?? "Noch offen"}</strong></span><span>Top-Kategorie<strong>{topCategory && topCategory[1] > 0 ? CATEGORY_LABELS[topCategory[0]] : "Noch offen"}</strong></span>
          </div>
        </section>

        <section className="panel transaction-panel">
          <div className="panel-header"><div><p className="panel-label">ECONOMY LEDGER</p><h3>Letzte Transaktionen</h3></div><ReceiptText size={18} /></div>
          <div className="transaction-list">
            {state.transactions.length === 0 ? <p>Noch keine Transaktionen.</p> : state.transactions.slice(0, 12).map((transaction) => (
              <article key={transaction.id}><div><strong>{transaction.type.replaceAll("_", " ")}</strong><span>{transaction.reference} · {formatTime(transaction.createdAt)}</span></div><em className={transaction.amount >= 0 ? "positive" : "negative"}>{transaction.amount >= 0 ? "+" : ""}{formatMoney(transaction.amount)}</em></article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
