import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(readFileSync("src/components/workshop-animation.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
runInThisContext(`(function(exports) { ${code} })`)(loaded.exports);
const { getWorkshopStep, getWorkshopIdleSpeech, WORKSHOP_STEP_X } = loaded.exports;

test("Founder advances at exactly 25, 50 and 75 percent and returns at 100", () => {
  for (const [progress, step] of [[0,0],[24.99,0],[25,1],[49.99,1],[50,2],[74.99,2],[75,3],[99.99,3],[100,null],[120,null]]) assert.equal(getWorkshopStep(progress), step);
  assert.deepEqual(WORKSHOP_STEP_X, [-4.5,-1.5,1.5,4.5]);
  assert.equal(getWorkshopStep(NaN),0);
  assert.equal(getWorkshopStep(-1),0);
});
test("idle bubbles are occasional, rotate and do not remain permanently visible", () => {
  assert.equal(getWorkshopIdleSpeech(11,false),null);
  assert.match(getWorkshopIdleSpeech(12,false),/langweilig/);
  assert.equal(getWorkshopIdleSpeech(17,false),null);
  assert.notEqual(getWorkshopIdleSpeech(40,false),getWorkshopIdleSpeech(12,false));
  assert.equal(getWorkshopIdleSpeech(Infinity,false),null);
  assert.match(getWorkshopIdleSpeech(12,true),/Abnahme/);
});
