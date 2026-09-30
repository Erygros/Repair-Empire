import type { OrderTemplate } from "@/game/types";

export const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    device: "Smartphone",
    issue: "Akku tauschen",
    diagnostic: "Zellspannung instabil",
    durationSeconds: 12,
    reward: 86,
    reputationReward: 2,
    difficulty: 1,
  },
  {
    device: "Smartphone",
    issue: "Ladeanschluss reinigen",
    diagnostic: "Kontaktwiderstand zu hoch",
    durationSeconds: 16,
    reward: 112,
    reputationReward: 2,
    difficulty: 1,
  },
  {
    device: "Controller",
    issue: "Stick-Modul ersetzen",
    diagnostic: "Achsendrift erkannt",
    durationSeconds: 18,
    reward: 138,
    reputationReward: 3,
    difficulty: 2,
  },
  {
    device: "Handheld",
    issue: "Display-Einheit tauschen",
    diagnostic: "Panel ohne Bildsignal",
    durationSeconds: 22,
    reward: 174,
    reputationReward: 4,
    difficulty: 2,
  },
  {
    device: "Game Console",
    issue: "Kühlsystem warten",
    diagnostic: "Temperaturlimit überschritten",
    durationSeconds: 25,
    reward: 214,
    reputationReward: 5,
    difficulty: 3,
  },
  {
    device: "Controller",
    issue: "Tastenmembran erneuern",
    diagnostic: "Eingaben werden ausgelassen",
    durationSeconds: 14,
    reward: 96,
    reputationReward: 2,
    difficulty: 1,
  },
  {
    device: "Handheld",
    issue: "Lüftereinheit reinigen",
    diagnostic: "Luftstrom eingeschränkt",
    durationSeconds: 19,
    reward: 146,
    reputationReward: 3,
    difficulty: 2,
  },
];

export const CUSTOMER_NAMES = [
  "M. Weber",
  "N. Kaya",
  "J. Hoffmann",
  "S. Novak",
  "A. Fischer",
  "T. Berger",
  "L. Nguyen",
  "C. Winter",
];

