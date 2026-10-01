import type { BuildingType } from "@/game/types";

export const CAMPUS_CONFIG = {
  width: 1600,
  height: 920,
  minZoom: 0.58,
  maxZoom: 1.35,
  defaultZoom: 0.82,
  focusZoom: 1.05,
} as const;

export interface CampusPlot {
  buildingId: BuildingType;
  x: number;
  y: number;
  width: number;
  depth: number;
  label: string;
  entranceAnchor: { x: number; y: number };
}

export const CAMPUS_PLOTS: CampusPlot[] = [
  { buildingId: "WORKSHOP", x: 610, y: 310, width: 370, depth: 240, label: "A-01", entranceAnchor:{x:800,y:550} },
  { buildingId: "TOOL_WAREHOUSE", x: 1080, y: 500, width: 270, depth: 180, label: "A-02", entranceAnchor:{x:1140,y:680} },
  { buildingId: "PERSONNEL", x: 310, y: 210, width: 220, depth: 165, label: "B-01", entranceAnchor:{x:420,y:375} },
  { buildingId: "BUSINESS_OFFICE", x: 255, y: 585, width: 285, depth: 185, label: "B-02", entranceAnchor:{x:400,y:770} },
  { buildingId: "RESEARCH", x: 1090, y: 145, width: 275, depth: 190, label: "C-01", entranceAnchor:{x:1225,y:335} },
  { buildingId: "FINANCE", x: 710, y: 705, width: 225, depth: 150, label: "C-02", entranceAnchor:{x:820,y:855} },
];

export const FUTURE_PLOTS = [
  { id: "future-logistics", x: 1370, y: 655, width: 155, depth: 115, label: "Baureserve" },
  { id: "future-expansion", x: 70, y: 390, width: 160, depth: 120, label: "Erweiterungsfläche" },
];

