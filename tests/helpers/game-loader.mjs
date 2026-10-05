import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runInThisContext } from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const cache = new Map();
const native = createRequire(import.meta.url);
export function loadGameModule(file) {
  const path = resolve(file);
  if (cache.has(path)) return cache.get(path).exports;
  const loaded = { exports: {} }; cache.set(path, loaded);
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: path })(name => {
    if (!name.startsWith("@/")) return native(name);
    const target = resolve("src", name.slice(2));
    return loadGameModule(target + (existsSync(target + ".ts") ? ".ts" : ".tsx"));
  }, loaded, loaded.exports);
  return loaded.exports;
}
