import { config } from "./config.js";
import { checkSite, siteStatus } from "./checker.js";
import { dispatchAlert } from "./alerts.js";
import { readState, recordCheck, getLatestCheck } from "./store.js";

const lastAlertAt = new Map();
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

const shouldAlert = (siteId, reason) => {
  const key = `${siteId}:${reason}`;
  const last = lastAlertAt.get(key) || 0;
  if (Date.now() - last < ALERT_COOLDOWN_MS) return false;
  lastAlertAt.set(key, Date.now());
  return true;
};

export const runAllChecks = async () => {
  const state = readState();
  const results = [];

  for (const site of state.sites) {
    const prev = getLatestCheck(site.id);
    const check = await checkSite(site);
    recordCheck(check);
    results.push({ site, check });

    const status = siteStatus(check, config.sslWarnDays);
    const prevStatus = prev ? siteStatus(prev, config.sslWarnDays) : null;

    if (status === "down" && shouldAlert(site.id, "down")) {
      await dispatchAlert({ site, check, reason: "Site is down or unreachable" });
    } else if (status === "ssl_warning" && shouldAlert(site.id, "ssl")) {
      await dispatchAlert({
        site,
        check,
        reason: `SSL certificate expires in ${check.ssl.daysLeft} days`
      });
    } else if (prevStatus === "down" && status === "healthy") {
      await dispatchAlert({ site, check, reason: "Site recovered" });
    }
  }

  return results;
};

export const startScheduler = () => {
  const intervalMs = config.checkIntervalMinutes * 60 * 1000;
  runAllChecks().catch((err) => console.error("[scheduler] initial run failed:", err));
  setInterval(() => {
    runAllChecks().catch((err) => console.error("[scheduler] run failed:", err));
  }, intervalMs);
  console.log(`[scheduler] checking every ${config.checkIntervalMinutes} minutes`);
};
