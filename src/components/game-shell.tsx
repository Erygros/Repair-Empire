"use client";

import { Activity, Banknote, Bolt, ShieldCheck, Wrench } from "lucide-react";
import { OrderBoard } from "@/components/order-board";
import { RepairBench } from "@/components/repair-bench";
import { RepairLog } from "@/components/repair-log";
import { useGame } from "@/game/state/use-game";
import { formatMoney } from "@/utils/format";

export function GameShell() {
  const game = useGame();
  const { state } = game;

  if (!game.hydrated) {
    return (
      <main className="boot-screen">
        <div className="boot-mark"><Wrench size={24} /></div>
        <p>Werkstatt wird hochgefahren</p>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Wrench size={22} /></div>
          <div>
            <p className="kicker">Werkstatt-Simulation</p>
            <h1>REPAIR <span>EMPIRE</span></h1>
          </div>
        </div>

        <div className="status-strip" aria-label="Werkstattstatus">
          <div className="status-item">
            <Banknote size={17} />
            <span>Kapital</span>
            <strong>{formatMoney(state.money)}</strong>
          </div>
          <div className="status-item">
            <ShieldCheck size={17} />
            <span>Reputation</span>
            <strong>{state.reputation}</strong>
          </div>
          <div className="status-item status-online">
            <Activity size={17} />
            <span>Status</span>
            <strong>Online</strong>
          </div>
        </div>
      </header>

      <section className="workshop-heading">
        <div>
          <p className="section-code">WERKSTATT // SEKTOR A</p>
          <h2>Die erste Werkbank läuft.</h2>
        </div>
        <div className="tool-readout">
          <Bolt size={17} />
          <span>Ausrüstung</span>
          <strong>Basic Tool Kit</strong>
        </div>
      </section>

      <div className="game-grid">
        <RepairBench
          activeRepair={state.activeRepair}
          now={game.now}
          progress={game.progress}
          onComplete={game.completeRepair}
        />
        <OrderBoard
          orders={state.availableOrders}
          benchOccupied={Boolean(state.activeRepair)}
          onAccept={game.acceptOrder}
        />
        <RepairLog repairs={state.completedRepairs} />
      </div>

      {game.notice && (
        <div className="toast" role="status">
          <span className="toast-light" />
          {game.notice}
        </div>
      )}
    </main>
  );
}

