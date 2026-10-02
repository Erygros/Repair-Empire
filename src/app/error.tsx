"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { ErrorIcon as AlertTriangle } from "@/components/repair-icons";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="game-error"><AlertTriangle size={30} /><p className="panel-label">SYSTEM INTERRUPT</p><h1>Dieser Bereich konnte nicht dargestellt werden.</h1><p>Dein gespeicherter Fortschritt wurde nicht zurückgesetzt.</p><button onClick={reset}><RotateCcw size={17} />Bereich erneut laden</button></main>;
}
