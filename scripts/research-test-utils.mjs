import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
export function loadTs(filename) {
  const absolute = path.resolve(filename);
  if (modules.has(absolute)) return modules.get(absolute);
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(code, { exports: mod.exports, module: mod, require: (id) => id.startsWith(".") ? loadTs(path.resolve(path.dirname(absolute), `${id}.ts`)) : nativeRequire(id), structuredClone, console });
  modules.set(absolute, mod.exports); return mod.exports;
}
