"use client";

import { useState } from "react";
import { Activity, Banknote, Bolt, PackageOpen, ShieldCheck, SlidersHorizontal, UsersRound, Wrench } from "lucide-react";
import { AssignmentDock } from "@/components/assignment-dock";
import { OfflineReport } from "@/components/offline-report";
import { OrderBoard } from "@/components/order-board";
import { RepairLog } from "@/components/repair-log";
import { TeamHub } from "@/components/team-hub";
import { ToolStore } from "@/components/tool-store";
import { UpgradeBay } from "@/components/upgrade-bay";
import { WorkstationDeck } from "@/components/workstation-deck";
import { getRepairLevel, getRepairLevelProgress } from "@/game/logic/game";
import { useGame } from "@/game/state/use-game";
import { formatMoney } from "@/utils/format";

type GameView = "workshop" | "team" | "tools" | "upgrades";

export function GameShell() {
  const game = useGame();
  const { state } = game;
  const [view, setView] = useState<GameView>("workshop");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const repairLevel = getRepairLevel(state.repairXp);
  const levelProgress = getRepairLevelProgress(state.repairXp);
  const selectedOrder = state.availableOrders.find((order) => order.id === selectedOrderId) ?? null;
  const unlockedStations = state.workstations.filter((station) => station.status !== "locked").length;

  if (!game.hydrated) {
    return <main className="boot-screen"><div className="boot-mark"><Wrench size={24} /></div><p>Werkstatt wird hochgefahren</p></main>;
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Wrench size={22} /></div>
          <div><p className="kicker">Werkstatt-Simulation</p><h1>REPAIR <span>EMPIRE</span></h1></div>
        </div>
        <div className="status-strip" aria-label="Werkstattstatus">
          <div className="status-item"><Banknote size={17} /><span>Kapital</span><strong>{formatMoney(state.money)}</strong></div>
          <div className="status-item"><ShieldCheck size={17} /><span>Reputation</span><strong>{state.reputation}</strong></div>
          <div className="status-item level-status"><Activity size={17} /><span>Repair-Level {repairLevel}</span><strong>{levelProgress.current}/{levelProgress.required} XP</strong><i><b style={{ width: `${levelProgress.percent}%` }} /></i></div>
        </div>
      </header>

      <section className="workshop-heading">
        <div><p className="section-code">WERKSTATT // SEKTOR A</p><h2>{view === "workshop" ? "Die Werkhalle wächst." : view === "team" ? "Teamzentrale" : view === "tools" ? "Werkzeuglager" : "Upgrade-Bay"}</h2></div>
        <div className="tool-readout"><Bolt size={17} /><span>Betrieb</span><strong>{unlockedStations}/4 Stationen · {state.employees.length} Techniker</strong></div>
      </section>

      <nav className="game-nav" aria-label="Spielbereiche">
        <button className={view === "workshop" ? "active" : ""} onClick={() => setView("workshop")}><Wrench size={17} />Werkstatt</button>
        <button className={view === "team" ? "active" : ""} onClick={() => setView("team")}><UsersRound size={17} />Team</button>
        <button className={view === "tools" ? "active" : ""} onClick={() => setView("tools")}><PackageOpen size={17} />Werkzeuge</button>
        <button className={view === "upgrades" ? "active" : ""} onClick={() => setView("upgrades")}><SlidersHorizontal size={17} />Upgrades</button>
      </nav>

      {view === "workshop" && (
        <div className="workshop-main-grid">
          <div className="workshop-production">
            <WorkstationDeck state={state} now={game.now} onPurchase={game.purchaseWorkstation} onComplete={game.completeRepair} onAssignEmployee={game.assignEmployee} onToggleAutomation={game.toggleAutomation} onSetPriority={game.setAutomationPriority} />
            <RepairLog repairs={state.completedRepairs} />
          </div>
          <OrderBoard orders={state.availableOrders} money={state.money} reputation={state.reputation} ownedTools={state.ownedTools} upgrades={state.upgrades} onAccept={setSelectedOrderId} />
        </div>
      )}
      {view === "team" && <TeamHub state={state} onHire={game.hireCandidate} onRefresh={game.refreshCandidates} />}
      {view === "tools" && <ToolStore money={state.money} reputation={state.reputation} ownedTools={state.ownedTools} onPurchase={game.purchaseTool} />}
      {view === "upgrades" && <UpgradeBay money={state.money} reputation={state.reputation} upgrades={state.upgrades} onPurchase={game.purchaseUpgrade} />}

      {selectedOrder && <AssignmentDock order={selectedOrder} state={state} onClose={() => setSelectedOrderId(null)} onAssign={(workstationId) => { game.assignOrder(selectedOrder.id, workstationId); setSelectedOrderId(null); }} />}
      {game.offlineSummary && <OfflineReport summary={game.offlineSummary} onClose={game.dismissOfflineSummary} />}
      {game.notice && <div className="toast" role="status"><span className="toast-light" />{game.notice}</div>}
    </main>
  );
}

