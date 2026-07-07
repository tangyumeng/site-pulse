import tls from "node:tls";
import { URL } from "node:url";

const fetchWithTimeout = async (url, ms = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "SitePulse/0.1" }
    });
    return { ok: res.ok, status: res.status, latencyMs: 0 };
  } finally {
    clearTimeout(timer);
  }
};

const getSslExpiry = (hostname, port = 443) =>
  new Promise((resolve) => {
    const socket = tls.connect({ host: hostname, port, servername: hostname }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert || !cert.valid_to) {
        resolve(null);
        return;
      }
      resolve(new Date(cert.valid_to));
    });
    socket.setTimeout(8000, () => {
      socket.destroy();
      resolve(null);
    });
    socket.on("error", () => resolve(null));
  });

export const checkSite = async (site) => {
  const started = Date.now();
  let normalizedUrl = site.url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let uptime = { up: false, status: 0, latencyMs: 0, error: "" };
  let ssl = { expiresAt: null, daysLeft: null };

  try {
    const result = await fetchWithTimeout(normalizedUrl);
    uptime = {
      up: result.ok,
      status: result.status,
      latencyMs: Date.now() - started,
      error: result.ok ? "" : `HTTP ${result.status}`
    };
  } catch (err) {
    uptime = {
      up: false,
      status: 0,
      latencyMs: Date.now() - started,
      error: err.name === "AbortError" ? "timeout" : String(err.message || err)
    };
  }

  try {
    const parsed = new URL(normalizedUrl);
    const expiresAt = await getSslExpiry(parsed.hostname);
    if (expiresAt) {
      const daysLeft = Math.ceil((expiresAt - Date.now()) / 86400000);
      ssl = { expiresAt: expiresAt.toISOString(), daysLeft };
    }
  } catch {
    // SSL check optional
  }

  return {
    siteId: site.id,
    checkedAt: new Date().toISOString(),
    uptime,
    ssl
  };
};

export const siteStatus = (check, sslWarnDays) => {
  if (!check) return "unknown";
  if (!check.uptime.up) return "down";
  if (check.ssl.daysLeft !== null && check.ssl.daysLeft <= sslWarnDays) {
    return "ssl_warning";
  }
  return "healthy";
};
