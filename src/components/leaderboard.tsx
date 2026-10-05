"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { FounderIcon, CompanyLevelIcon, ReputationIcon, CapitalIcon, CustomersIcon, SeasonsIcon } from "@/components/repair-icons";
import { formatMoney, formatNumber } from "@/utils/format";
import type { LeaderboardResult, RankingRow, RankingSort } from "@/game/types/leaderboard";
import "./leaderboard.css";
const tabs = [{ type: "empire", label: "Empire", icon: CompanyLevelIcon }, { type: "wealth", label: "Vermögen", icon: CapitalIcon }, { type: "customers", label: "Kunden", icon: CustomersIcon }, { type: "season", label: "Season", icon: SeasonsIcon }];
type Selection = { type: string; sort: RankingSort | "season"; page: number };
function readSelection(): Selection {
  if (typeof window === "undefined") return { type: "empire", sort: "level", page: 1 };
  const params = new URLSearchParams(window.location.search);
  const type = tabs.some(tab => tab.type === params.get("type")) ? params.get("type")! : "empire";
  const sort = type === "season" ? "season" : type === "wealth" ? "capital" : type === "customers" ? "customers" : params.get("sort") === "reputation" ? "reputation" : "level";
  const value = Number(params.get("page") ?? 1);
  return { type, sort, page: Number.isInteger(value) && value >= 1 && value <= 100000 ? value : 1 };
}
const labels = { level: "Firmenlevel", reputation: "Reputation", capital: "Kapital", customers: "Kunden bedient", season: "Season" };
function primary(row: RankingRow, sort: Selection["sort"]) { return sort === "capital" ? formatMoney(row.capital) : formatNumber(sort === "reputation" ? row.reputation : sort === "customers" ? row.customersServed : row.companyLevel); }
function secondary(row: RankingRow, sort: Selection["sort"]) { return sort === "level" ? `${formatNumber(row.companyXp)} XP · ${formatNumber(row.reputation)} Reputation` : sort === "customers" ? `${formatNumber(row.successfulRepairs)} Reparaturen` : `Level ${formatNumber(row.companyLevel)}`; }
const rankNumber = (rank: number) => new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(rank);
export function Leaderboard({ verified, onActivate }: { verified: boolean | null; onActivate: () => void }) {
  const [selection, setSelection] = useState<Selection>(readSelection);
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { const pop = () => setSelection(readSelection()); window.addEventListener("popstate", pop); return () => window.removeEventListener("popstate", pop); }, []);
  useEffect(() => { const timer = window.setInterval(() => setRefresh(value => value + 1), 30000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/leaderboard?sort=${selection.sort}&page=${selection.page}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error(response.status === 401 ? "Bitte erneut anmelden." : "Rangliste nicht erreichbar."); setData(await response.json());
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selection, refresh, verified]);
  function select(next: Selection) { setLoading(true); setError(""); setData(null); setSelection(next); const params = new URLSearchParams({ type: next.type, sort: next.sort, page: String(next.page) }); window.history.replaceState(null, "", `/leaderboard?${params}`); }
  return <section className="leaderboard" aria-busy={loading}>
    <header className="ranking-header"><div><p className="panel-label">PERMANENT WORLD</p><h2>Rangliste</h2><p>Die größten Repair Empires.</p></div><button className="ranking-icon-button" title="Rangliste aktualisieren" aria-label="Rangliste aktualisieren" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={19} /></button></header>
    <div className="ranking-tabs" role="tablist" aria-label="Ranglisten">{tabs.map(tab => <button key={tab.type} role="tab" aria-selected={selection.type === tab.type} onClick={() => select({ type: tab.type, sort: tab.type === "empire" ? "level" : tab.type === "wealth" ? "capital" : tab.type === "customers" ? "customers" : "season", page: 1 })}><tab.icon size={24} />{tab.label}</button>)}</div>
    {selection.type === "empire" && <div className="ranking-sort" aria-label="Empire-Sortierung"><button aria-pressed={selection.sort === "level"} onClick={() => select({ ...selection, sort: "level", page: 1 })}><CompanyLevelIcon size={20} />Level</button><button aria-pressed={selection.sort === "reputation"} onClick={() => select({ ...selection, sort: "reputation", page: 1 })}><ReputationIcon size={20} />Reputation</button></div>}
    {error && <p role="alert" className="ranking-empty">{error}</p>}
    {selection.type === "season" ? <div className="ranking-empty ranking-season"><SeasonsIcon size={64} /><h3>Season-Rangliste</h3><p>Derzeit keine aktive Season.</p></div> : <>
      <aside className="ranking-own" aria-label="Dein Rang"><div><p className="panel-label">DEIN RANG</p>{data?.own ? <><strong>#{rankNumber(data.own.rank)} <span>{data.own.ceoName}</span></strong><p>{labels[selection.sort]} {primary(data.own, selection.sort)} · {secondary(data.own, selection.sort)}</p></> : <><strong>{verified ? "Noch kein Rang verfügbar" : "Noch nicht gewertet"}</strong><p>{verified ? "Bestätigter Spielstand wird synchronisiert." : "Lokaler Fortschritt bleibt privat. Ranglistenfortschritt beginnt mit einem eigenen bestätigten Startspielstand."}</p></>}</div>{verified === false && <button className="ranking-activate" onClick={onActivate}>Server-Spielstand aktivieren</button>}</aside>
      {loading && !data && !error && <p role="status" className="ranking-empty">Rangliste wird geladen.</p>}
      {data && !error && <><div className="ranking-podium">{data.top.map(row => <article key={row.rank} className={`ranking-winner rank-${row.rank}`}><div className="ranking-position">#{rankNumber(row.rank)}</div><FounderIcon size={64} /><h3 title={row.ceoName}>{row.ceoName}</h3><p>{labels[selection.sort]}</p><strong>{primary(row, selection.sort)}</strong><small>{secondary(row, selection.sort)}</small>{row.own && <span className="ranking-you">DU</span>}</article>)}</div>
        {data.rows.length ? <div className="ranking-table" role="table" aria-label={labels[selection.sort]}><div className="ranking-row ranking-table-head" role="row"><span role="columnheader">Rang</span><span role="columnheader">CEO</span><span role="columnheader">{labels[selection.sort]}</span><span role="columnheader">{selection.sort === "level" ? "XP / Reputation" : selection.sort === "customers" ? "Reparaturen" : "Firmenlevel"}</span></div>{data.rows.filter(row => selection.page > 1 || row.rank > 3).map(row => <div key={row.rank} className={`ranking-row${row.own ? " is-own" : ""}`} role="row"><span role="cell" className="ranking-row-rank">#{rankNumber(row.rank)}</span><span role="cell" className="ranking-ceo" title={row.ceoName}>{row.ceoName}{row.own && <small>DU</small>}</span><strong role="cell">{primary(row, selection.sort)}</strong><span role="cell" className="ranking-detail">{secondary(row, selection.sort)}</span></div>)}</div> : <p className="ranking-empty">{selection.page > 1 ? "Auf dieser Seite gibt es keine Einträge." : "Noch keine bestätigten Unternehmen in der Rangliste."}</p>}
        <footer className="ranking-pagination"><button className="ranking-icon-button" aria-label="Vorherige Seite" title="Vorherige Seite" disabled={selection.page === 1 || loading} onClick={() => select({ ...selection, page: selection.page - 1 })}><ArrowLeft size={20} /></button><span>Seite {rankNumber(selection.page)}</span><button className="ranking-icon-button" aria-label="Nächste Seite" title="Nächste Seite" disabled={!data.hasNext || loading} onClick={() => select({ ...selection, page: selection.page + 1 })}><ArrowRight size={20} /></button></footer></>}
    </>}
  </section>;
}
