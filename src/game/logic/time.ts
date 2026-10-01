export const OFFLINE_CAPACITY_MS = 8 * 60 * 60 * 1000;
export const JOB_BOARD_REFRESH_MS = 45 * 1000;
export const URGENT_JOB_LIFETIME_MS = 3 * 60 * 1000;

export function getCurrentTime() {
  return Date.now();
}

export function getDayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getOfflineWindow(lastActiveAt: number, now: number, capacityMs: number) {
  const rawDurationMs = now - lastActiveAt;
  if (!Number.isFinite(rawDurationMs) || rawDurationMs <= 0) {
    return { durationMs: 0, productiveDurationMs: 0, capacityReached: false, simulationEnd: lastActiveAt };
  }
  const safeCapacity = Math.max(0, Math.min(capacityMs, 24 * 60 * 60 * 1000));
  const productiveDurationMs = Math.min(rawDurationMs, safeCapacity);
  return {
    durationMs: rawDurationMs,
    productiveDurationMs,
    capacityReached: rawDurationMs > safeCapacity,
    simulationEnd: lastActiveAt + productiveDurationMs,
  };
}
