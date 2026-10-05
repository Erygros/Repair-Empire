import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInThisContext } from "node:vm";
import ts from "typescript";

// These pure modules use TS path aliases; transpile them without a browser or DB.
function loadModule(file, dependencies = {}) {
  const path = resolve(file);
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  runInThisContext(`(function(require, module, exports) { ${code}\n })`, { filename: path })(name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports);
  return loaded.exports;
}
const data = loadModule("src/game/data/cosmetics.ts");
const { ensureDefaultCosmetics, grantCosmetic } = loadModule("src/game/logic/cosmetics.ts", { "@/game/data/cosmetics": data, "@/game/data/character-models": loadModule("src/game/data/character-models.ts") });
const empty = () => ({ cosmeticEntitlements: [], cosmeticUnlockNotice: null, money: 500 });

test("starter cosmetics are granted silently and do not mutate the save", () => {
  const original = empty();
  const result = ensureDefaultCosmetics(original, 100);
  assert.equal(result.cosmeticUnlockNotice, null);
  assert.deepEqual(result.cosmeticEntitlements.map(item => item.cosmeticId), data.DEFAULT_COSMETIC_IDS);
  assert.equal(result.money, 500);
  assert.equal(original.cosmeticEntitlements.length, 0);
});
test("starter grants remain idempotent and preserve a pending earned reward", () => {
  const first = ensureDefaultCosmetics({ ...empty(), cosmeticUnlockNotice: "outfit-orange-jacket" }, 100);
  const second = ensureDefaultCosmetics(first, 200);
  assert.equal(second.cosmeticUnlockNotice, "outfit-orange-jacket");
  assert.deepEqual(second.cosmeticEntitlements, first.cosmeticEntitlements);
});
test("earned cosmetics still create a reward notice", () => {
  const result = grantCosmetic(empty(), "outfit-orange-jacket", "PROGRESSION", 100);
  assert.equal(result.unlocked, true);
  assert.equal(result.state.cosmeticUnlockNotice, "outfit-orange-jacket");
});
