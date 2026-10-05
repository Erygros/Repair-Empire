"use client";

import type { Character3DAppearance } from "@/components/character-3d";
import { SAVE_VERSION } from "@/game/data/progression";
import { createPlayerCharacter, ensureDefaultCosmetics, equipCosmetic, unequipCosmetic } from "@/game/logic/cosmetics";
import { updateFounderModel } from "@/game/logic/founder-model";
import {
  createInitialState,
  processOfflineProgress,
  runWorkstationTick
} from "@/game/logic/game";
import { isImportableSave } from "@/game/logic/health";
import { awardCompanyXp } from "@/game/logic/progression";
import { migrateSave } from "@/game/logic/save";
import { getCurrentTime } from "@/game/logic/time";
import type { AutomationPriority, BuildingType, CharacterAppearance, CharacterCosmeticSlot, GameState, OfflineSummary, ResearchId, ToolId, UpgradeId } from "@/game/types";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { applyGameAction, type GameAction } from "@/game/logic/actions";

const STORAGE_KEY = "repair-empire-save-v1";

function loadGameSession(): { state: GameState; offlineSummary: OfflineSummary | null } {
  if (typeof window === "undefined") return { state: createInitialState(), offlineSummary: null };
  try {
    const rawSave = window.localStorage.getItem(STORAGE_KEY);
    if (rawSave) {
      const migrated = migrateSave(JSON.parse(rawSave));
      if (migrated) {
        const offline = processOfflineProgress(migrated);
        return { state: offline.state, offlineSummary: offline.summary };
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return { state: createInitialState(), offlineSummary: null };
}

const subscribeToHydration = () => () => undefined;
type Transaction = { state: GameState; notice: string };

export function useGame() {
  const [initialSession] = useState(loadGameSession);
  const [state, setState] = useState<GameState>(initialSession.state);
  const stateRef = useRef(state);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(initialSession.offlineSummary);
  const [now, setNow] = useState(getCurrentTime);
  const [notice, setNotice] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const verifiedRef = useRef<boolean | null>(null);
  const revisionRef = useRef(0);
  const queue = useRef(Promise.resolve());
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const applyState = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const receiveVerified = useCallback((result: { enabled?: boolean; state?: GameState; revision?: number; offlineSummary?: OfflineSummary | null; notice?: string; message?: string }) => {
    verifiedRef.current = result.enabled ?? false;
    setVerified(result.enabled ?? false);
    if (result.state) {
      setOfflineSummary(result.offlineSummary ?? null);
      revisionRef.current = result.revision ?? 0;
      const local = stateRef.current;
      // Cosmetics remain local presentation; founder skill and all economic state come from the server.
      applyState({ ...result.state, playerCharacter: result.state.playerCharacter && local.playerCharacter ? { ...result.state.playerCharacter, equippedCosmetics: local.playerCharacter.equippedCosmetics } : result.state.playerCharacter });
    }
    if (result.offlineSummary) setOfflineSummary(result.offlineSummary);
    if (result.notice || result.message) setNotice(result.notice ?? result.message ?? null);
  }, [applyState]);

  useEffect(() => {
    let disposed = false;
    fetch("/api/game/verified", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (!disposed) receiveVerified(result);
    }).catch(() => { if (!disposed) setNotice("Server-Spielstand nicht erreichbar. Bitte Seite neu laden."); });
    return () => { disposed = true; };
  }, [receiveVerified]);

  const sendVerified = useCallback((action?: GameAction) => {
    queue.current = queue.current.then(async () => {
      const response = await fetch("/api/game/verified", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ revision: revisionRef.current, ...(action ? { action } : {}) }) });
      if (response.ok || response.status === 409) receiveVerified(await response.json());
      else throw new Error();
    }).catch(() => { setNotice("Aktion nicht bestätigt. Verbindung prüfen und erneut versuchen."); });
  }, [receiveVerified]);

  const dispatch = useCallback((action: GameAction) => {
    if (verifiedRef.current === null) { setNotice("Server-Spielstand wird geprüft."); return; }
    if (verifiedRef.current) { sendVerified(action); return; }
    const result = applyGameAction(stateRef.current, action, getCurrentTime());
    applyState(result.state);
    setNotice(result.notice);
  }, [applyState, sendVerified]);

  const activateVerified = useCallback(async () => {
    if (!window.confirm("Serverbestätigten Spielstand mit Startkapital beginnen? Dein bisheriger lokaler Spielstand bleibt unverändert erhalten und zählt nicht zur Rangliste.")) return;
    verifiedRef.current = null;
    setVerified(null);
    try {
      const response = await fetch("/api/game/verified", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ activate: true }) });
      if (!response.ok) throw new Error();
      receiveVerified(await response.json());
    } catch { verifiedRef.current = false; setVerified(false); setNotice("Server-Spielstand konnte nicht aktiviert werden."); }
  }, [receiveVerified]);

  useEffect(() => {
    if (!verified) return;
    const timer = window.setInterval(() => sendVerified(), 10000);
    const sync = () => { if (document.visibilityState === "visible") sendVerified(); };
    document.addEventListener("visibilitychange", sync);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", sync); };
  }, [verified, sendVerified]);

  const commit = useCallback((transaction: (current: GameState) => Transaction) => {
    const result = transaction(stateRef.current);
    applyState(result.state);
    setNotice(result.notice);
  }, [applyState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const tickNow = getCurrentTime();
      setNow(tickNow);
      if (verifiedRef.current !== false) return;
      const result = runWorkstationTick(stateRef.current, tickNow);
      if (result.changed) {
        applyState(result.state);
        if (result.notice) setNotice(result.notice);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [applyState]);

  useEffect(() => {
    if (!hydrated || verifiedRef.current !== false) return;
    const savedAt = getCurrentTime();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, saveVersion: SAVE_VERSION, lastSavedAt: savedAt, lastActiveAt: savedAt }));
  }, [state, hydrated, verified]);

  useEffect(() => {
    if (!hydrated || verifiedRef.current !== false) return;
    const saveHeartbeat = () => {
      if (verifiedRef.current !== false) return;
      const savedAt = getCurrentTime();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stateRef.current, saveVersion: SAVE_VERSION, lastSavedAt: savedAt, lastActiveAt: savedAt }));
    };
    const timer = window.setInterval(saveHeartbeat, 10_000);
    const onVisibility = () => { if (document.visibilityState === "hidden") saveHeartbeat(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [hydrated, verified]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const assignOrder = useCallback((orderId: string, workstationId: string) => dispatch({ type: "assignOrder", orderId, workstationId }), [dispatch]);

  const completeRepair = useCallback((workstationId: string) => dispatch({ type: "completeRepair", workstationId }), [dispatch]);

  const purchaseWorkstation = useCallback((workstationId: string) => dispatch({ type: "purchaseWorkstation", workstationId }), [dispatch]);

  const hireCandidate = useCallback((candidateId: string) => dispatch({ type: "hireCandidate", candidateId }), [dispatch]);

  const refreshCandidates = useCallback(() => dispatch({ type: "refreshCandidates" }), [dispatch]);

  const assignEmployee = useCallback((workstationId: string, employeeId: string | null) => dispatch({ type: "assignEmployee", workstationId, employeeId }), [dispatch]);

  const toggleAutomation = useCallback((workstationId: string) => dispatch({ type: "toggleAutomation", workstationId }), [dispatch]);

  const setAutomationPriority = useCallback((workstationId: string, priority: AutomationPriority) => dispatch({ type: "setAutomationPriority", workstationId, priority }), [dispatch]);

  const purchaseTool = useCallback((toolId: ToolId) => dispatch({ type: "purchaseTool", toolId }), [dispatch]);

  const purchaseUpgrade = useCallback((upgradeId: UpgradeId) => dispatch({ type: "purchaseUpgrade", upgradeId }), [dispatch]);

  const purchaseResearch = useCallback((researchId: ResearchId) => dispatch({ type: "purchaseResearch", researchId }), [dispatch]);

  const claimMilestone = useCallback((milestoneId: string) => dispatch({ type: "claimMilestone", milestoneId }), [dispatch]);

  const claimChallenge = useCallback((challengeId: string) => dispatch({ type: "claimChallenge", challengeId }), [dispatch]);

  const startMultiDeviceOrder = useCallback((customerId: string) => dispatch({ type: "startMultiDeviceOrder", customerId }), [dispatch]);

  const takeContract = useCallback((contractId: string) => dispatch({ type: "takeContract", contractId }), [dispatch]);

  const collectContractReward = useCallback((contractId: string) => dispatch({ type: "collectContractReward", contractId }), [dispatch]);

  const purchaseBuildingUpgrade = useCallback((buildingId: BuildingType) => dispatch({ type: "purchaseBuildingUpgrade", buildingId }), [dispatch]);

  const createFounder = useCallback((name: string, appearance: CharacterAppearance, outfitId: string) => commit((current) => {
    if (current.playerCharacter) return { state: current, notice: "Founder existiert bereits" };
    const now = getCurrentTime();
    const withDefaults = ensureDefaultCosmetics(current, now);
    return { state: { ...withDefaults, playerCharacter: createPlayerCharacter(name, appearance, outfitId, now), cosmeticUnlockNotice: null }, notice: `Founder ${name} erstellt` };
  }), [commit]);

  const equipCharacterCosmetic = useCallback((cosmeticId: string) => commit((current) => {
    const result = equipCosmetic(current, cosmeticId);
    return { state: result.state, notice: result.error ?? "Cosmetic ausgerüstet" };
  }), [commit]);

  const unequipCharacterCosmetic = useCallback((slot: CharacterCosmeticSlot) => commit((current) => ({ state: unequipCosmetic(current, slot), notice: `${slot} entfernt` })), [commit]);

  const updateFounderAppearance = useCallback((appearance: CharacterAppearance) => commit((current) => current.playerCharacter ? { state: { ...current, playerCharacter: { ...current.playerCharacter, appearance } }, notice: "Founder-Aussehen aktualisiert" } : { state: current, notice: "Founder Character fehlt" }), [commit]);
  const updateFounder3D = useCallback((name: string, model: Character3DAppearance) => commit(current => current.playerCharacter ? { state: { ...current, playerCharacter: updateFounderModel(current.playerCharacter, name, model) }, notice: "Founder gespeichert" } : { state: current, notice: "Founder Character fehlt" }), [commit]);

  const importSave = useCallback((json: string) => {
    if (verifiedRef.current !== false) return "Import ist im serverbestätigten Spielstand nicht verfügbar.";
    try {
      const parsed: unknown = JSON.parse(json);
      if (!isImportableSave(parsed)) return "Save-Struktur ist ungültig";
      const migrated = migrateSave(parsed);
      if (!migrated) return "Save konnte nicht migriert werden";
      applyState(migrated);
      setNotice("Spielstand importiert");
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error("Save import failed", error);
      return "JSON konnte nicht gelesen werden";
    }
  }, [applyState]);

  const runDevAction = useCallback((action: "MONEY" | "XP" | "REPUTATION" | "COMPLETE") => commit((current) => {
    if (verifiedRef.current !== false) return { state: current, notice: "Dev-Aktionen sind im serverbestätigten Spielstand gesperrt." };
    if (process.env.NODE_ENV !== "development") return { state: current, notice: "" };
    if (action === "MONEY") return { state: { ...current, money: current.money + 50_000 }, notice: "DEV · 50.000 EUR hinzugefügt" };
    if (action === "REPUTATION") return { state: { ...current, reputation: current.reputation + 50 }, notice: "DEV · 50 Reputation hinzugefügt" };
    if (action === "XP") return { state: awardCompanyXp(current, 5_000, getCurrentTime()).state, notice: "DEV · Company XP hinzugefügt" };
    const now = getCurrentTime();
    return { state: { ...current, workstations: current.workstations.map((station) => station.activeRepair ? { ...station, status: "completed" as const, activeRepair: { ...station.activeRepair, endsAt: now - 1 } } : station) }, notice: "DEV · Aktive Reparaturen abgeschlossen" };
  }), [commit]);

  return {
    verified,
    activateVerified,
    state,
    hydrated,
    now,
    notice,
    offlineSummary,
    assignOrder,
    completeRepair,
    purchaseWorkstation,
    hireCandidate,
    refreshCandidates,
    assignEmployee,
    toggleAutomation,
    setAutomationPriority,
    purchaseResearch,
    claimMilestone,
    claimChallenge,
    startMultiDeviceOrder,
    takeContract,
    collectContractReward,
    purchaseBuildingUpgrade,
    createFounder,
    equipCharacterCosmetic,
    unequipCharacterCosmetic,
    updateFounderAppearance,
    updateFounder3D,
    importSave,
    runDevAction,
    dismissCosmeticUnlock: () => commit((current) => ({ state: { ...current, cosmeticUnlockNotice: null }, notice: "" })),
    dismissOfflineSummary: () => setOfflineSummary(null),
    purchaseTool,
    purchaseUpgrade,
  };
}

