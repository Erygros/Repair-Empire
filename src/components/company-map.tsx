"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { CampusBuilding } from "@/components/campus-building";
import { CharacterRenderer } from "@/components/character-renderer";
import { CAMPUS_CONFIG, CAMPUS_PLOTS, FUTURE_PLOTS } from "@/game/data/campus";
import { getBuildingUpgradeCheck } from "@/game/logic/buildings";
import type { BuildingType, GameState } from "@/game/types";

type Camera = { x: number; y: number; zoom: number };

function clampCamera(camera: Camera) {
  const marginX = CAMPUS_CONFIG.width * 0.34;
  const marginY = CAMPUS_CONFIG.height * 0.38;
  return { x: Math.max(-marginX, Math.min(marginX, camera.x)), y: Math.max(-marginY, Math.min(marginY, camera.y)), zoom: Math.max(CAMPUS_CONFIG.minZoom, Math.min(CAMPUS_CONFIG.maxZoom, camera.zoom)) };
}

function getNotification(state: GameState, buildingId: BuildingType) {
  if (buildingId === "WORKSHOP" && state.workstations.some((station) => station.status === "completed")) return "Reparatur fertig";
  if (buildingId === "BUSINESS_OFFICE" && state.contractOffers.length > 0) return `${state.contractOffers.length} Angebot${state.contractOffers.length > 1 ? "e" : ""}`;
  if (buildingId === "RESEARCH" && state.researchPoints > 0) return `${state.researchPoints} FP verfügbar`;
  if (getBuildingUpgradeCheck(state, buildingId).available) return "Ausbau verfügbar";
  return null;
}

function CompanyMapComponent({ state, onOpenBuilding, onOpenProfile }: { state: GameState; onOpenBuilding: (buildingId: BuildingType) => void; onOpenProfile: () => void }) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: CAMPUS_CONFIG.defaultZoom });
  const [selected, setSelected] = useState<BuildingType | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragOrigin = useRef<{ x: number; y: number; camera: Camera } | null>(null);
  const pinchDistance = useRef<number | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (openTimer.current) clearTimeout(openTimer.current); }, []);
  useEffect(() => {
    const fitMobile = () => {
      if (window.innerWidth < 700) setCamera((current) => current.zoom > .62 ? { ...current, zoom: CAMPUS_CONFIG.minZoom } : current);
    };
    fitMobile();
    window.addEventListener("resize", fitMobile);
    return () => window.removeEventListener("resize", fitMobile);
  }, []);

  const zoomBy = useCallback((amount: number) => setCamera((current) => clampCamera({ ...current, zoom: current.zoom + amount })), []);
  const resetCamera = useCallback(() => setCamera({ x: 0, y: 0, zoom: CAMPUS_CONFIG.defaultZoom }), []);

  const selectBuilding = useCallback((buildingId: BuildingType) => {
    const plot = CAMPUS_PLOTS.find((item) => item.buildingId === buildingId)!;
    setSelected(buildingId);
    setCamera((current) => clampCamera({ x: (CAMPUS_CONFIG.width / 2 - plot.x - plot.width / 2) * .28, y: (CAMPUS_CONFIG.height / 2 - plot.y - plot.depth / 2) * .2, zoom: Math.max(current.zoom, CAMPUS_CONFIG.focusZoom) }));
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => onOpenBuilding(buildingId), 220);
  }, [onOpenBuilding]);

  return (
    <section className="company-map-shell" aria-label="Firmen-Campus">
      <div className="map-hud"><div><span>COMPANY PROPERTY</span><strong>{state.identity.companyName}</strong></div><p>Campus online · {state.buildings.length} Gebäude</p></div>
      <div
        className="map-viewport"
        onWheel={(event) => { event.preventDefault(); zoomBy(event.deltaY > 0 ? -.08 : .08); }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest(".campus-building, .founder-map-entity")) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 1) dragOrigin.current = { x: event.clientX, y: event.clientY, camera };
          if (pointers.current.size === 2) { const [a, b] = [...pointers.current.values()]; pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y); }
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinchDistance.current) zoomBy((distance - pinchDistance.current) / 450);
            pinchDistance.current = distance;
          } else if (dragOrigin.current) {
            setCamera(clampCamera({ ...dragOrigin.current.camera, x: dragOrigin.current.camera.x + event.clientX - dragOrigin.current.x, y: dragOrigin.current.camera.y + event.clientY - dragOrigin.current.y }));
          }
        }}
        onPointerUp={(event) => { pointers.current.delete(event.pointerId); dragOrigin.current = null; pinchDistance.current = null; }}
        onPointerCancel={(event) => { pointers.current.delete(event.pointerId); dragOrigin.current = null; pinchDistance.current = null; }}
      >
        <div className="map-world" style={{ width: CAMPUS_CONFIG.width, height: CAMPUS_CONFIG.height, transform: `translate(calc(-50% + ${camera.x}px), calc(-50% + ${camera.y}px)) scale(${camera.zoom})` }}>
          <div className="campus-boundary" /><div className="campus-green green-a"/><div className="campus-green green-b"/>
          <div className="campus-road road-main" /><div className="campus-road road-cross" /><div className="campus-path path-admin"/><div className="campus-path path-lab"/>
          <div className="parking-lot">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
          <div className="service-yard"><span>LIEFERZONE</span></div><div className="campus-props"><i/><i/><i/><b/><b/><span/></div>
          {FUTURE_PLOTS.map((plot) => <div className="future-plot" key={plot.id} style={{ left: plot.x, top: plot.y, width: plot.width, height: plot.depth }}><span>{plot.label}</span></div>)}
          {CAMPUS_PLOTS.map((plot) => <CampusBuilding key={plot.buildingId} plot={plot} state={state} notification={getNotification(state, plot.buildingId)} selected={selected === plot.buildingId} recentUpgrade={state.lastBuildingUpgrade?.buildingId === plot.buildingId} onSelect={selectBuilding} />)}
          {state.playerCharacter && <div className="map-entity-layer"><button className="founder-map-entity" onClick={onOpenProfile} aria-label={`${state.playerCharacter.displayName} Profil öffnen`}><CharacterRenderer appearance={state.playerCharacter.appearance} cosmetics={state.playerCharacter.equippedCosmetics} mode="MAP" /><span>{state.playerCharacter.displayName}<small>FOUNDER</small></span></button></div>}
        </div>
      </div>
      <div className="map-controls" aria-label="Kartensteuerung"><button onClick={() => zoomBy(.12)} title="Vergrößern"><Plus size={17} /></button><button onClick={() => zoomBy(-.12)} title="Verkleinern"><Minus size={17} /></button><button onClick={resetCamera} title="Karte zentrieren"><LocateFixed size={17} /></button></div>
      <div className="map-legend"><span><i className="live" /> Betrieb</span><span><i className="expand" /> Ausbau</span><span><i className="future" /> Reservefläche</span></div>
    </section>
  );
}

export const CompanyMap = memo(CompanyMapComponent, (previous, next) => previous.state.buildings === next.state.buildings && previous.state.contractOffers === next.state.contractOffers && previous.state.workstations === next.state.workstations && previous.state.researchPoints === next.state.researchPoints && previous.state.lastBuildingUpgrade === next.state.lastBuildingUpgrade && previous.state.playerCharacter === next.state.playerCharacter && previous.state.identity.companyName === next.state.identity.companyName && previous.onOpenBuilding === next.onOpenBuilding && previous.onOpenProfile === next.onOpenProfile);

