export function formatMoney(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumSignificantDigits: Math.abs(value) >= 1_000_000 ? 3 : undefined,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE", { notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function formatClock(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

