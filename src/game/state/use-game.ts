"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createInitialState, createOrder, getRepairProgress } from "@/game/logic/game";
import type { GameState } from "@/game/types";

const STORAGE_KEY = "repair-empire-save-v1";

function isValidSave(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const save = value as Partial<GameState>;
  return (
    typeof save.money === "number" &&
    typeof save.reputation === "number" &&
    Array.isArray(save.availableOrders) &&
    Array.isArray(save.completedRepairs) &&
    typeof save.nextOrderNumber === "number"
  );
}

function loadGame(): GameState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const rawSave = window.localStorage.getItem(STORAGE_KEY);
    if (rawSave) {
      const parsed: unknown = JSON.parse(rawSave);
      if (isValidSave(parsed)) return parsed;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return createInitialState();
}

const subscribeToHydration = () => () => undefined;

export function useGame() {
  const [state, setState] = useState<GameState>(loadGame);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, lastSavedAt: Date.now() }),
    );
  }, [state, hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const progress = useMemo(
    () => getRepairProgress(state.activeRepair, now),
    [state.activeRepair, now],
  );

  const acceptOrder = useCallback((orderId: string) => {
    setState((current) => {
      if (current.activeRepair) return current;
      const order = current.availableOrders.find((item) => item.id === orderId);
      if (!order) return current;
      const startedAt = Date.now();
      return {
        ...current,
        availableOrders: current.availableOrders.filter((item) => item.id !== orderId),
        activeRepair: {
          order,
          startedAt,
          endsAt: startedAt + order.durationSeconds * 1000,
        },
      };
    });
    setNotice("Auftrag an Werkbank 01 übergeben");
  }, []);

  const completeRepair = useCallback(() => {
    setState((current) => {
      if (!current.activeRepair || Date.now() < current.activeRepair.endsAt) return current;
      const { order } = current.activeRepair;
      const replacement = createOrder(current.nextOrderNumber);
      return {
        ...current,
        money: current.money + order.reward,
        reputation: current.reputation + order.reputationReward,
        activeRepair: null,
        availableOrders: [...current.availableOrders, replacement],
        completedRepairs: [
          {
            id: order.id,
            device: order.device,
            issue: order.issue,
            reward: order.reward,
            reputationReward: order.reputationReward,
            completedAt: Date.now(),
          },
          ...current.completedRepairs,
        ].slice(0, 20),
        nextOrderNumber: current.nextOrderNumber + 1,
      };
    });
    setNotice("Reparatur abgenommen · Auszahlung verbucht");
  }, []);

  return {
    state,
    hydrated,
    now,
    notice,
    progress,
    acceptOrder,
    completeRepair,
  };
}

