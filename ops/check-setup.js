import { config, hasEmailAlerts, hasTelegramAlerts } from "../src/config.js";
import { readState } from "../src/store.js";
import { getLatestCheck } from "../src/store.js";
import { siteStatus } from "../src/checker.js";

const state = readState();
let issues = 0;

console.log("=== SitePulse Setup Check ===\n");

if (!state.sites.length) {
  console.log("⚠  No sites configured yet. Add one at /dashboard");
} else {
  console.log(`✓ ${state.sites.length} site(s) configured`);
}

for (const site of state.sites) {
  const check = getLatestCheck(site.id);
  const status = siteStatus(check, config.sslWarnDays);
  const icon = status === "healthy" ? "✓" : "⚠";
  console.log(`  ${icon} ${site.clientName}: ${status}`);
  if (status !== "healthy") issues += 1;
}

console.log("");
if (hasTelegramAlerts()) console.log("✓ Telegram alerts configured");
else console.log("○ Telegram alerts not configured (optional)");

if (hasEmailAlerts()) console.log("✓ Email alerts configured");
else console.log("○ Email alerts not configured (optional)");

console.log(`\nCheck interval: every ${config.checkIntervalMinutes} minutes`);
console.log(`SSL warning threshold: ${config.sslWarnDays} days`);

if (issues > 0) {
  console.log(`\n⚠ ${issues} site(s) need attention`);
  process.exit(1);
}

console.log("\nAll checks passed.");
