import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync("src/components/campus-walk.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
runInThisContext(`(function(exports) { ${compiled} })`)(loaded.exports);
const { getCampusWalkPose } = loaded.exports;

test("founder stays on the road and walks in both directions", () => {
  for (let time = 0; time < 96; time += .1) assert(Math.abs(getCampusWalkPose(time).x) <= 9);
  assert(getCampusWalkPose(1).x > getCampusWalkPose(0).x);
  assert(getCampusWalkPose(10).x < getCampusWalkPose(9).x);
  assert.equal(getCampusWalkPose(0).direction, 1);
  assert.equal(getCampusWalkPose(9).direction, -1);
});
test("turns are continuous and the patrol repeats", () => {
  for (const turn of [8, 24, 40]) assert(Math.abs(getCampusWalkPose(turn - .001).x - getCampusWalkPose(turn + .001).x) < .003);
  assert.deepEqual(getCampusWalkPose(0), { x: 0, direction: 1, stride: 0 });
  assert.equal(getCampusWalkPose(32).x, 0);
  assert.equal(getCampusWalkPose(Infinity).x, 0);
});
