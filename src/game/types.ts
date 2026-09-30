export type DeviceKind =
  | "Smartphone"
  | "Controller"
  | "Handheld"
  | "Game Console";

export type Urgency = "standard" | "express";

export interface OrderTemplate {
  device: DeviceKind;
  issue: string;
  diagnostic: string;
  durationSeconds: number;
  reward: number;
  reputationReward: number;
  difficulty: 1 | 2 | 3;
}

export interface RepairOrder extends OrderTemplate {
  id: string;
  customer: string;
  urgency: Urgency;
  createdAt: number;
}

export interface ActiveRepair {
  order: RepairOrder;
  startedAt: number;
  endsAt: number;
}

export interface CompletedRepair {
  id: string;
  device: DeviceKind;
  issue: string;
  reward: number;
  reputationReward: number;
  completedAt: number;
}

export interface GameState {
  money: number;
  reputation: number;
  availableOrders: RepairOrder[];
  activeRepair: ActiveRepair | null;
  completedRepairs: CompletedRepair[];
  nextOrderNumber: number;
  lastSavedAt: number;
}

