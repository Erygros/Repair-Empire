"use client";

import { useState } from "react";
import { Bug, Clipboard, Download, X } from "lucide-react";
import { getGameStateIssues } from "@/game/logic/health";
import type { GameState } from "@/game/types";

export function PrototypeDevPanel({ state, onImport, onAction }: { state: GameState; onImport: (json: string) => string | null; onAction: (action: "MONEY" | "XP" | "REPUTATION" | "COMPLETE") => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  if (process.env.NODE_ENV !== "development") return null;
  const issues = getGameStateIssues(state);
  const exportSave = () => { const json = JSON.stringify(state, null, 2); void navigator.clipboard.writeText(json); setMessage("Save JSON in Zwischenablage"); };
  const importSave = () => { const json = window.prompt("Save JSON einfügen"); if (!json) return; setMessage(onImport(json) ?? "Save importiert"); };
  return <><button className="dev-trigger" onClick={() => setOpen(!open)} title="Development Tools"><Bug size={16} /></button>{open && <aside className="dev-panel"><header><strong>DEV CONSOLE</strong><button onClick={() => setOpen(false)}><X size={15} /></button></header><div className={`health-state ${issues.length ? "bad" : "good"}`}>{issues.length ? issues.join(" · ") : "State invariants OK"}</div><div className="dev-actions"><button onClick={() => onAction("MONEY")}>+50K Money</button><button onClick={() => onAction("XP")}>+Level XP</button><button onClick={() => onAction("REPUTATION")}>+50 Rep</button><button onClick={() => onAction("COMPLETE")}>Repairs fertig</button></div><div className="dev-save"><button onClick={exportSave}><Download size={14} />Export</button><button onClick={importSave}><Clipboard size={14} />Import</button></div>{message && <p>{message}</p>}</aside>}</>;
}
