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
}

export const CAMPUS_PLOTS: CampusPlot[] = [
  { buildingId: "WORKSHOP", x: 650, y: 350, width: 330, depth: 210, label: "A-01" },
  { buildingId: "TOOL_WAREHOUSE", x: 1060, y: 485, width: 245, depth: 165, label: "A-02" },
  { buildingId: "PERSONNEL", x: 310, y: 220, width: 225, depth: 155, label: "B-01" },
  { buildingId: "BUSINESS_OFFICE", x: 275, y: 580, width: 250, depth: 170, label: "B-02" },
  { buildingId: "RESEARCH", x: 1080, y: 160, width: 260, depth: 180, label: "C-01" },
  { buildingId: "FINANCE", x: 760, y: 700, width: 220, depth: 145, label: "C-02" },
];

export const FUTURE_PLOTS = [
  { id: "future-logistics", x: 1370, y: 655, width: 155, depth: 115, label: "D-01" },
  { id: "future-expansion", x: 70, y: 390, width: 160, depth: 120, label: "D-02" },
];

