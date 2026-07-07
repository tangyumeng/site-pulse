#!/usr/bin/env node
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
  "APP_URL"
];

function parseEnvValue(raw) {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function loadEnv() {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i)] = parseEnvValue(trimmed.slice(i + 1));
  }
  return env;
}

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    input,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Failed: ${cmd}`);
  }
  return result.stdout;
}

function setVercelEnv(name, value) {
  if (!value) {
    console.log(`○ Skipping ${name} (empty)`);
    return false;
  }
  console.log(`→ ${name}`);
  spawnSync("npx", ["vercel", "env", "rm", name, "production", "-y"], {
    cwd: ROOT,
    stdio: "ignore"
  });
  run("npx", ["vercel", "env", "add", name, "production"], value);
  return true;
}

if (!existsSync(ENV_FILE)) {
  console.error("Missing .env");
  process.exit(1);
}

const env = loadEnv();
let updated = 0;
for (const name of VARS) {
  if (setVercelEnv(name, env[name])) updated += 1;
}

console.log(`\nSynced ${updated} vars. Run: npm run deploy:prod`);
