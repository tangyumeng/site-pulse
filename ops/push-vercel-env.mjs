#!/usr/bin/env node
/**
 * Push .env vars to Vercel production without printing secret values.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env");
const VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_MANAGED",
  "STRIPE_WEBHOOK_SECRET",
  "APP_URL",
  "DATA_DIR"
];

function parse(line) {
  const i = line.indexOf("=");
  if (i === -1) return null;
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return [line.slice(0, i), v];
}

function loadEnv() {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const p = parse(t);
    if (p) env[p[0]] = p[1];
  }
  return env;
}

function setEnv(name, value) {
  if (!value) {
    console.log(`skip ${name} (empty)`);
    return false;
  }
  spawnSync("npx", ["vercel", "env", "rm", name, "production", "-y"], {
    cwd: ROOT,
    stdio: "ignore"
  });
  const r = spawnSync("npx", ["vercel", "env", "add", name, "production"], {
    cwd: ROOT,
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (r.status !== 0) {
    console.error(`fail ${name}:`, (r.stderr || r.stdout || "").slice(0, 200));
    return false;
  }
  console.log(`ok ${name}`);
  return true;
}

if (!existsSync(ENV_FILE)) {
  console.error("missing .env");
  process.exit(1);
}

const env = loadEnv();
let n = 0;
for (const key of VARS) {
  if (setEnv(key, env[key])) n += 1;
}
console.log(`synced ${n}/${VARS.length}`);
process.exit(n > 0 ? 0 : 1);
