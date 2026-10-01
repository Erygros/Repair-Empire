"use client";

import { useCallback, useState } from "react";
import { Activity, Banknote, Bolt, Building2, ShieldCheck, SlidersHorizontal, Target, Wrench } from "lucide-react";
import { AssignmentDock } from "@/components/assignment-dock";
import { ChallengeCenter } from "@/components/challenge-center";
import { CompanyMap } from "@/components/company-map";
import { BuildingViewShell } from "@/components/building-view-shell";
import { CharacterCreator } from "@/components/character-creator";
import { CharacterProfile } from "@/components/character-profile";
import { CosmeticUnlock } from "@/components/cosmetic-unlock";
import { CustomerCenter } from "@/components/customer-center";
import { EconomyDashboard } from "@/components/economy-dashboard";
import { MilestoneReport } from "@/components/milestone-report";
import { OfflineReport } from "@/components/offline-report";
import { OrderBoard } from "@/components/order-board";
import { RepairLog } from "@/components/repair-log";
import { ProgressionStrip } from "@/components/progression-strip";
import { ResearchLab } from "@/components/research-lab";
import { TeamHub } from "@/components/team-hub";
import { ToolStore } from "@/components/tool-store";
import { UpgradeBay } from "@/components/upgrade-bay";
import { WorkstationDeck } from "@/components/workstation-deck";
import { getRepairLevel, getRepairLevelProgress } from "@/game/logic/game";
import { useGame } from "@/game/state/use-game";
import { formatMoney } from "@/utils/format";
import type { BuildingType } from "@/game/types";

type GameView = "company" | "profile" | "workshop" | "customers" | "team" | "research" | "challenges" | "economy" | "tools" | "upgrades";
const BUILDING_VIEWS: Record<BuildingType, GameView> = { WORKSHOP: "workshop", PERSONNEL: "team", FINANCE: "economy", TOOL_WAREHOUSE: "tools", RESEARCH: "research", BUSINESS_OFFICE: "customers" };
const VIEW_BUILDINGS: Partial<Record<GameView, BuildingType>> = { workshop: "WORKSHOP", team: "PERSONNEL", economy: "FINANCE", tools: "TOOL_WAREHOUSE", research: "RESEARCH", customers: "BUSINESS_OFFICE" };

export function GameShell() {
  const game = useGame();
  const { state } = game;
  const [view, setView] = useState<GameView>("company");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const repairLevel = getRepairLevel(state.repairXp);
  const levelProgress = getRepairLevelProgress(state.repairXp);
  const selectedOrder = state.availableOrders.find((order) => order.id === selectedOrderId) ?? null;
  const unlockedStations = state.workstations.filter((station) => station.status !== "locked").length;
  const activeBuilding = VIEW_BUILDINGS[view] ?? null;
  const openBuilding = useCallback((buildingId: BuildingType) => setView(BUILDING_VIEWS[buildingId]), []);
  const openProfile = useCallback(() => setView("profile"), []);

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
          <div className="status-item level-status"><Activity size={17} /><span>Company-Level {repairLevel}</span><strong>{levelProgress.current}/{levelProgress.required} XP</strong><i><b style={{ width: `${levelProgress.percent}%` }} /></i></div>
        </div>
      </header>

      {view !== "company" && view !== "profile" && <ProgressionStrip state={state} />}

      {view !== "company" && view !== "profile" && <section className="workshop-heading">
        <div><p className="section-code">COMPANY // CAMPUS</p><h2>{view === "workshop" ? "Die Werkhalle wächst." : view === "customers" ? "Kunden & Verträge" : view === "team" ? "Teamzentrale" : view === "research" ? "Forschungszentrum" : view === "challenges" ? "Auftragsziele" : view === "economy" ? "Unternehmenszahlen" : view === "tools" ? "Werkzeuglager" : "Upgrade-Bay"}</h2></div>
        <div className="tool-readout"><Bolt size={17} /><span>Betrieb</span><strong>{unlockedStations}/4 Stationen · {state.employees.length} Techniker</strong></div>
      </section>}

      {view !== "company" && view !== "profile" && <nav className="game-nav secondary-game-nav" aria-label="Spielbereiche">
        <button onClick={() => setView("company")}><Building2 size={17} />Campus</button>
        <button className={view === "challenges" ? "active" : ""} onClick={() => setView("challenges")}><Target size={17} />Aufgaben</button>
        <button className={view === "upgrades" ? "active" : ""} onClick={() => setView("upgrades")}><SlidersHorizontal size={17} />Upgrades</button>
      </nav>}

      {view === "company" && <CompanyMap state={state} onOpenBuilding={openBuilding} onOpenProfile={openProfile} />}
      {view === "profile" && state.playerCharacter && <CharacterProfile state={state} onBack={() => setView("company")} onEquip={game.equipCharacterCosmetic} onUnequip={game.unequipCharacterCosmetic} onAppearance={game.updateFounderAppearance} />}
      {activeBuilding && <BuildingViewShell buildingId={activeBuilding} state={state} onClose={() => setView("company")} onUpgrade={game.purchaseBuildingUpgrade}>
        {view === "workshop" && <div className="workshop-main-grid"><div className="workshop-production"><WorkstationDeck state={state} now={game.now} onPurchase={game.purchaseWorkstation} onComplete={game.completeRepair} onAssignEmployee={game.assignEmployee} onToggleAutomation={game.toggleAutomation} onSetPriority={game.setAutomationPriority} /><RepairLog repairs={state.completedRepairs} /></div><OrderBoard orders={state.availableOrders} money={state.money} reputation={state.reputation} ownedTools={state.ownedTools} upgrades={state.upgrades} researchedNodes={state.researchedNodes} now={game.now} onAccept={setSelectedOrderId} /></div>}
        {view === "team" && <TeamHub state={state} onHire={game.hireCandidate} onRefresh={game.refreshCandidates} />}
        {view === "customers" && <CustomerCenter state={state} now={game.now} onAcceptContract={game.takeContract} onClaimContract={game.collectContractReward} onCreateMultiOrder={game.startMultiDeviceOrder} />}
        {view === "research" && <ResearchLab state={state} onResearch={game.purchaseResearch} />}
        {view === "economy" && <EconomyDashboard state={state} />}
        {view === "tools" && <ToolStore money={state.money} reputation={state.reputation} ownedTools={state.ownedTools} onPurchase={game.purchaseTool} />}
      </BuildingViewShell>}
      {view === "challenges" && <ChallengeCenter state={state} onClaim={game.claimChallenge} />}
      {view === "upgrades" && <UpgradeBay money={state.money} reputation={state.reputation} upgrades={state.upgrades} onPurchase={game.purchaseUpgrade} />}

      {selectedOrder && <AssignmentDock order={selectedOrder} state={state} onClose={() => setSelectedOrderId(null)} onAssign={(workstationId) => { game.assignOrder(selectedOrder.id, workstationId); setSelectedOrderId(null); }} />}
      {game.offlineSummary && <OfflineReport summary={game.offlineSummary} onClose={game.dismissOfflineSummary} />}
      <MilestoneReport state={state} onClaim={game.claimMilestone} />
      {!state.playerCharacter && <CharacterCreator onCreate={game.createFounder} />}
      {state.cosmeticUnlockNotice && state.playerCharacter && <CosmeticUnlock cosmeticId={state.cosmeticUnlockNotice} character={state.playerCharacter} onClose={game.dismissCosmeticUnlock} />}
      {game.notice && <div className="toast" role="status"><span className="toast-light" />{game.notice}</div>}
    </main>
  );
}

