import { readState } from "../src/store.js";
import { getLatestCheck } from "../src/store.js";
import { siteStatus } from "../src/checker.js";
import { config } from "../src/config.js";

const state = readState();
const today = new Date().toISOString().slice(0, 10);

let healthy = 0;
let down = 0;
let sslWarning = 0;

for (const site of state.sites) {
  const check = getLatestCheck(site.id);
  const status = siteStatus(check, config.sslWarnDays);
  if (status === "healthy") healthy += 1;
  else if (status === "down") down += 1;
  else if (status === "ssl_warning") sslWarning += 1;
}

const report = {
  date: today,
  total: state.sites.length,
  healthy,
  down,
  sslWarning,
  alertsSent: state.alerts.filter((a) => a.sentAt.startsWith(today)).length
};

console.log(JSON.stringify(report, null, 2));
