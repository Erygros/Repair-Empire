"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { BrandLogo, InfoIcon, LevelUpIcon, FounderActiveIcon, ChallengeActiveIcon, SettingsIcon } from "@/components/repair-icons";
import { AccountSettings } from "@/components/account-settings";
import { Leaderboard } from "@/components/leaderboard";
import { CompanyLevelIcon } from "@/components/repair-icons";
import { LogoutButton } from "@/components/logout-button";
import { ChallengeIcon as Target, FounderIcon as UserRound } from "@/components/repair-icons";
import { CompanyLevelIcon as Activity, CapitalIcon as Banknote, BuildingsIcon as Building2, ResearchIcon as FlaskConical, ToolsIcon as PackageOpen, ReputationIcon as ShieldCheck, EfficiencyIcon as SlidersHorizontal, EmployeesIcon as UsersRound, ReceiptIcon as Wallet, RepairsIcon as Wrench, CustomersIcon as Handshake } from "@/components/repair-icons";
import { AssignmentDock } from "@/components/assignment-dock";
import { ChallengeCenter } from "@/components/challenge-center";
import { CompanyMap } from "@/components/company-map";
import { BuildingViewShell } from "@/components/building-view-shell";
import { CharacterProfile } from "@/components/character-profile";
import { CosmeticUnlock } from "@/components/cosmetic-unlock";
import { CustomerCenter } from "@/components/customer-center";
import { EconomyDashboard } from "@/components/economy-dashboard";
import { MilestoneReport } from "@/components/milestone-report";
import { OfflineReport } from "@/components/offline-report";
import { ResearchLab } from "@/components/research-lab";
import { TeamHub } from "@/components/team-hub";
import { ToolStore } from "@/components/tool-store";
import { UpgradeBay } from "@/components/upgrade-bay";
import { WorkshopExperience } from "@/components/workshop-experience";
import { DepartmentScene } from "@/components/department-scene";
import { useWorkshopAmbience } from "@/components/use-workshop-ambience";
import { PrototypeSettings, usePrototypeSettings } from "@/components/prototype-settings";
import { PrototypeDevPanel } from "@/components/prototype-dev-panel";
import { playPrototypeSound } from "@/game/audio/prototype-audio";
import { getWorkstationEligibility } from "@/game/logic/game";
import { useGame } from "@/game/state/use-game";
import { formatMoney } from "@/utils/format";
import type { BuildingType } from "@/game/types";
import "./game-v3.css";

type GameView = "company" | "profile" | "workshop" | "customers" | "team" | "research" | "challenges" | "economy" | "tools" | "upgrades" | "settings" | "leaderboard";
const BUILDING_VIEWS: Record<BuildingType, GameView> = { WORKSHOP: "workshop", PERSONNEL: "team", FINANCE: "economy", TOOL_WAREHOUSE: "tools", RESEARCH: "research", BUSINESS_OFFICE: "customers" };
const VIEW_BUILDINGS: Partial<Record<GameView, BuildingType>> = { workshop: "WORKSHOP", team: "PERSONNEL", economy: "FINANCE", tools: "TOOL_WAREHOUSE", research: "RESEARCH", customers: "BUSINESS_OFFICE" };
const NAV_ITEMS = [
  { view: "company", label: "Firma", icon: Building2 },
  { view: "workshop", label: "Werkstatt", icon: Wrench },
  { view: "tools", label: "Werkzeuge", icon: PackageOpen },
  { view: "team", label: "Team", icon: UsersRound },
  { view: "customers", label: "Kunden", icon: Handshake },
  { view: "research", label: "Forschung", icon: FlaskConical },
  { view: "economy", label: "Finanzen", icon: Wallet },
  { view: "challenges", label: "Aufgaben", icon: Target },
  { view: "upgrades", label: "Upgrades", icon: SlidersHorizontal },
  { view: "leaderboard", label: "Rangliste", icon: CompanyLevelIcon },
  { view: "profile", label: "Charakter", icon: UserRound },
  { view: "settings", label: "Einstellungen", icon: SettingsIcon },
] satisfies { view: GameView; label: string; icon: ComponentType<{size?:number}> }[];

export function GameShell({ initialView = "company" }: { initialView?: GameView }) {
  const game = useGame();
  const { state } = game;
  const [view, setView] = useState<GameView>(initialView);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [levelFeedback, setLevelFeedback] = useState<string | null>(null);
  const previousLevel = useRef(state.companyLevel);
  const profileDirty=useRef(false);
  const contentRef=useRef<HTMLDivElement>(null);
  const setProfileDirty=useCallback((dirty:boolean)=>{profileDirty.current=dirty;},[]);
  const { settings, setSettings } = usePrototypeSettings();
  useWorkshopAmbience(view === "workshop" && game.hydrated, settings);
  const selectedOrder = state.availableOrders.find((order) => order.id === selectedOrderId) ?? null;
  const activeBuilding = VIEW_BUILDINGS[view] ?? null;
  const navigate = useCallback((next: GameView) => { if(profileDirty.current && next!=="profile" && !window.confirm("Ungespeicherte Character-Änderungen verwerfen?"))return;setView(next); if(next === "leaderboard") window.history.replaceState(null,"","/leaderboard"); else if(window.location.pathname === "/leaderboard") window.history.replaceState(null,"","/play"); setSelectedOrderId(null); contentRef.current?.scrollTo({ top: 0, behavior: "instant" }); window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  const openBuilding = useCallback((buildingId: BuildingType) => navigate(BUILDING_VIEWS[buildingId]), [navigate]);
  const openProfile = useCallback(() => navigate("profile"), [navigate]);
  const acceptOrder = (orderId: string) => {
    const order = state.availableOrders.find(item => item.id === orderId);
    if (!order) return null;
    const eligible = state.workstations.filter(station => getWorkstationEligibility(state, station, order).eligible);
    if (eligible.length === 1) { game.assignOrder(orderId, eligible[0].id); return eligible[0].id; }
    setSelectedOrderId(orderId);
    return null;
  };

  useEffect(() => {
    if (state.companyLevel > previousLevel.current) {
      setLevelFeedback(state.companyLevel >= 60 && previousLevel.current < 60 ? "WORKSHOP EXPANSION AVAILABLE · WORKSTATION 2 CAN NOW BE PURCHASED" : `COMPANY LEVEL ${state.companyLevel}`);
      playPrototypeSound("level-up", settings);
      const timer = window.setTimeout(() => setLevelFeedback(null), 3200);
      previousLevel.current = state.companyLevel;
      return () => window.clearTimeout(timer);
    }
    previousLevel.current = state.companyLevel;
  }, [settings, state.companyLevel]);

  useEffect(() => {
    if (!game.notice) return;
    if (game.notice.includes("Reparatur abgenommen")) playPrototypeSound("repair-complete", settings);
    else if (game.notice.includes("übergeben")) playPrototypeSound("repair-start", settings);
    else if (game.notice.includes("Level") || game.notice.includes("ausgebaut")) playPrototypeSound("building-upgrade", settings);
  }, [game.notice, settings]);

  if (!game.hydrated) {
    return <main className="boot-screen"><BrandLogo variant="mark"/><p>Werkstatt wird hochgefahren</p></main>;
  }

  return (
    <main className="game-shell game-v3" onPointerDown={() => playPrototypeSound("click", settings)}>
      <header className="topbar">
        <div className="brand-lockup">
          <BrandLogo/>
          <h1 className="brand-visually-hidden">Repair Empire</h1>
        </div>
        <div className="status-strip" aria-label="Werkstattstatus">
          <div className="status-item"><Banknote size={17} /><span>Kapital</span><strong>{formatMoney(state.money)}</strong></div>
          <div className="status-item"><ShieldCheck size={17} /><span>Reputation</span><strong>{state.reputation}</strong></div>
          <div className="status-item"><Activity size={17} /><span>Firmenlevel</span><strong>{state.companyLevel}</strong></div>
        </div>
        <PrototypeSettings settings={settings} onChange={setSettings} onReset={() => { if (window.confirm("Spielstand wirklich vollständig zurücksetzen?")) { localStorage.removeItem("repair-empire-save-v1"); window.location.reload(); } }} />
      </header>

      <div className="game-workspace">
      <nav className="game-rail" aria-label="Spielbereiche">{NAV_ITEMS.map(item => { const Icon = view===item.view&&item.view==="profile"?FounderActiveIcon:view===item.view&&item.view==="challenges"?ChallengeActiveIcon:item.icon; return <button key={item.view} className={item.view === "profile" ? "rail-profile" : undefined} aria-current={view === item.view ? "page" : undefined} onClick={() => navigate(item.view)}><Icon size={24}/><span>{item.label}</span></button>; })}<LogoutButton label="Abmelden" icon beforeLogout={() => { if (profileDirty.current && !window.confirm("Ungespeicherte Character-Änderungen verwerfen und abmelden?")) return false; const now = Date.now(); if (game.verified === false) localStorage.setItem("repair-empire-save-v1", JSON.stringify({ ...state, lastSavedAt: now, lastActiveAt: now })); return true; }}/></nav>
      <div className="game-content" ref={contentRef}>
      {view === "leaderboard" && <Leaderboard verified={game.verified} onActivate={game.activateVerified}/>}
      {view === "settings" && <AccountSettings/>}
      {(view === "challenges" || view === "upgrades") && <header className="game-view-title"><p className="panel-label">DEIN UNTERNEHMEN</p><h2>{view === "challenges" ? "Aufgaben" : "Upgrades"}</h2></header>}
      {view === "company" && <CompanyMap state={state} onOpenBuilding={openBuilding} onOpenProfile={openProfile} motion={settings.motion} />}
      {view === "profile" && state.playerCharacter && <CharacterProfile state={state} onBack={() => navigate("company")} onSave={game.updateFounder3D} onDirtyChange={setProfileDirty} motion={settings.motion} />}
      {activeBuilding && <BuildingViewShell buildingId={activeBuilding} state={state} onClose={() => navigate("company")} onUpgrade={game.purchaseBuildingUpgrade}>
        {view === "workshop" && <WorkshopExperience state={state} now={game.now} onAccept={acceptOrder} onPurchase={game.purchaseWorkstation} onComplete={game.completeRepair} onAssignEmployee={game.assignEmployee} onToggleAutomation={game.toggleAutomation} onSetPriority={game.setAutomationPriority} motion={settings.motion} />}
        {view !== "workshop" && view !== "company" && view !== "profile" && view !== "challenges" && view !== "upgrades" && view !== "settings" && view !== "leaderboard" && <div className="department-layout"><DepartmentScene key={view} department={view} state={state} motion={settings.motion} onProfile={openProfile}/><div className="department-controls">
        {view === "team" && <TeamHub state={state} onHire={game.hireCandidate} onRefresh={game.refreshCandidates} />}
        {view === "customers" && <CustomerCenter state={state} now={game.now} onAcceptContract={game.takeContract} onClaimContract={game.collectContractReward} onCreateMultiOrder={game.startMultiDeviceOrder} />}
        {view === "research" && <ResearchLab state={state} onResearch={game.purchaseResearch} />}
        {view === "economy" && <EconomyDashboard state={state} />}
        {view === "tools" && <ToolStore money={state.money} reputation={state.reputation} ownedTools={state.ownedTools} onPurchase={game.purchaseTool} />}
        </div></div>}
      </BuildingViewShell>}
      {(view === "challenges"||view === "upgrades") && <div className="department-layout"><DepartmentScene key={view} department={view} state={state} motion={settings.motion} onProfile={openProfile}/><div className="department-controls">{view === "challenges"?<ChallengeCenter state={state} onClaim={game.claimChallenge}/>:<UpgradeBay money={state.money} reputation={state.reputation} upgrades={state.upgrades} onPurchase={game.purchaseUpgrade}/>}</div></div>}
      </div></div>

      {selectedOrder && <AssignmentDock order={selectedOrder} state={state} onClose={() => setSelectedOrderId(null)} onAssign={(workstationId) => { game.assignOrder(selectedOrder.id, workstationId); setSelectedOrderId(null); }} />}
      {game.offlineSummary && <OfflineReport summary={game.offlineSummary} onClose={game.dismissOfflineSummary} />}
      <MilestoneReport state={state} onClaim={game.claimMilestone} />
      {state.cosmeticUnlockNotice && state.playerCharacter && <CosmeticUnlock cosmeticId={state.cosmeticUnlockNotice} character={state.playerCharacter} onClose={game.dismissCosmeticUnlock} />}
      {game.notice && <div className="toast" role="status"><InfoIcon size="sm"/>{game.notice}</div>}
      {levelFeedback && <div className="level-feedback" role="status"><LevelUpIcon size="md"/><span>PROGRESSION UPDATE</span><strong>{levelFeedback}</strong><button onClick={() => setLevelFeedback(null)}>OK</button></div>}
      <PrototypeDevPanel state={state} onImport={game.importSave} onAction={game.runDevAction} />
    </main>
  );
}

