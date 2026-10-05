import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("founder rigs sample a static pose without a frame-driven mixer", () => {
  const source = readFileSync("src/components/founder-model-3d.tsx", "utf8");
  assert.match(source, /action\.paused = true; mixer\.update\(0\)/);
  assert.doesNotMatch(source, /useFrame|FounderAnimation/);
});

test("map and workshop actors have no walking or phone movement", () => {
  const campus = readFileSync("src/components/campus-art.tsx", "utf8");
  const workshop = readFileSync("src/components/workshop-floor-3d.tsx", "utf8");
  const actor = workshop.slice(workshop.indexOf("export function WorkshopActor"), workshop.indexOf("export function SpeechProjection"));
  assert.doesNotMatch(campus, /getCampusFounderActivity|animation=/);
  assert.doesNotMatch(actor, /useFrame|animation=|position\.x\s*\+=/);
  assert.match(actor, /position=\{\[homeX,\.035,homeZ\]\}/);
});
