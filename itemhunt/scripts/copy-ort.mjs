import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = "node_modules/onnxruntime-web/dist";
const dest = "public/ort";

mkdirSync(dest, { recursive: true });

for (const f of readdirSync(src)) {
  const isWasm = f.endsWith(".wasm");
  const isLoader = f.startsWith("ort-wasm") && f.endsWith(".mjs");
  if (isWasm || isLoader) cpSync(join(src, f), join(dest, f));
}

console.log("ONNX Runtime files copied to public/ort");