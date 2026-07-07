import { mkdir, writeFile } from "node:fs/promises";
import { readState } from "../src/store.js";
import { getLatestCheck } from "../src/store.js";
import { siteStatus } from "../src/checker.js";
import { config } from "../src/config.js";

const state = readState();
const today = new Date().toISOString().slice(0, 10);

let healthy = 0;
let down = 0;

for (const site of state.sites) {
  const check = getLatestCheck(site.id);
  const status = siteStatus(check, config.sslWarnDays);
  if (status === "healthy") healthy += 1;
  else if (status === "down") down += 1;
}

const actions = [];
if (state.sites.length === 0) {
  actions.push("Add 3 demo client sites to test the dashboard flow.");
}
if (down > 0) {
  actions.push(`Follow up on ${down} down site(s) — good content for r/freelance value post.`);
}
if (!config.stripeSecretKey) {
  actions.push("Run npm run setup-stripe after adding STRIPE_SECRET_KEY to .env");
}
actions.push("Post r/selfhosted Show thread with Docker one-liner + status page screenshot.");
actions.push("Share one client-site monitoring tip on X/Indie Hackers.");

const output = {
  generatedAt: new Date().toISOString(),
  date: today,
  sites: state.sites.length,
  healthy,
  down,
  managed: state.subscription?.status === "active",
  targetDailyUsd: 10,
  actions
};

await mkdir("data/reports", { recursive: true });
await writeFile("data/reports/growth-actions.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
