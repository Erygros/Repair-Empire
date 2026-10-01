import { memo } from "react";
import { CharacterRenderer } from "@/components/character-renderer";
import type { CharacterAppearance, Employee, EquippedCharacterCosmetics } from "@/game/types";

function hash(value: string) { return [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7); }

export function getEmployeeAppearance(employee: Pick<Employee, "id">): CharacterAppearance {
  const seed = hash(employee.id);
  const bodies = ["COMPACT", "BALANCED", "TALL"] as const;
  const skins = ["LIGHT", "WARM", "MEDIUM", "DEEP"] as const;
  const faces = ["FOCUSED", "CALM", "BOLD"] as const;
  const hair = ["SHORT", "CROP", "WAVES", "TIED"] as const;
  const colors = ["BLACK", "BROWN", "COPPER", "BLONDE", "SILVER"] as const;
  return { bodyPreset: bodies[seed % bodies.length], skinTone: skins[(seed >>> 3) % skins.length], facePreset: faces[(seed >>> 5) % faces.length], hairStyle: hair[(seed >>> 7) % hair.length], hairColor: colors[(seed >>> 9) % colors.length] };
}

const WORKWEAR: EquippedCharacterCosmetics = { OUTFIT: "outfit-dark-technician", HEADWEAR: null, ACCESSORY: null };

function TechnicianVisualComponent({ employee, phase, founderName }: { employee: Employee | null; phase: string; founderName?: string }) {
  const identity = employee ? getEmployeeAppearance(employee) : { bodyPreset: "BALANCED", skinTone: "WARM", facePreset: "FOCUSED", hairStyle: "SHORT", hairColor: "BROWN" } satisfies CharacterAppearance;
  const pose = phase === "COMPLETED" ? "CELEBRATE" : phase === "REPAIRING" ? "WORK" : phase === "IDLE" ? "IDLE" : "INTERACT";
  return <div className={`technician-visual technician-${phase.toLowerCase()}`}><CharacterRenderer appearance={identity} cosmetics={WORKWEAR} mode="SMALL" pose={pose} /><span>{employee?.name ?? founderName ?? "Founder"}</span></div>;
}

export const TechnicianVisual = memo(TechnicianVisualComponent);
