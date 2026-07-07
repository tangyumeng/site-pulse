import express from "express";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { config, hasStripe } from "./config.js";
import {
  readState,
  addSite,
  removeSite,
  updateSite,
  getLatestCheck,
  getSite,
  getSiteLimit,
  upsertSubscription,
  hasProcessedStripeEvent,
  markStripeEventProcessed,
  isManagedActive
} from "./store.js";
import { siteStatus } from "./checker.js";
import { startScheduler } from "./scheduler.js";
import { getStripe, getManagedPriceId } from "./stripe.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

const siteSchema = z.object({
  clientName: z.string().min(1).max(80),
  url: z.string().min(3).max(300),
  notes: z.string().max(500).optional()
});

export const createApp = () => {
  const app = express();

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe();
      if (!stripe || !config.stripeWebhookSecret) {
        return res.status(503).send("Stripe not configured");
      }
      try {
        const signature = req.headers["stripe-signature"];
        const event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          config.stripeWebhookSecret
        );
        if (hasProcessedStripeEvent(event.id)) {
          return res.json({ received: true, duplicate: true });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          upsertSubscription({
            status: "active",
            plan: "managed",
            stripeCustomerId: String(session.customer || ""),
            stripeSubscriptionId: String(session.subscription || ""),
            activatedAt: new Date().toISOString()
          });
        }

        if (event.type === "customer.subscription.deleted") {
          const subscription = event.data.object;
          const state = readState();
          if (state.subscription?.stripeSubscriptionId === String(subscription.id)) {
            upsertSubscription({ status: "cancelled", plan: "self-hosted" });
          }
        }

        markStripeEventProcessed(event.id);
        return res.json({ received: true });
      } catch (error) {
        return res.status(400).send(`webhook error: ${error.message}`);
      }
    }
  );

  app.use(express.json());
  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  const sendHtml = async (res, filename) => {
    const filePath = path.join(publicDir, filename);
    if (!existsSync(filePath)) {
      return res.status(500).send("Page not found");
    }
    const html = await readFile(filePath, "utf8");
    return res.type("html").send(html);
  };

  const healthPayload = () => ({
    ok: true,
    service: "site-pulse",
    managed: isManagedActive(),
    hasStripe: hasStripe()
  });

  app.get("/health", (_req, res) => res.json(healthPayload()));
  app.get("/api/health", (_req, res) => res.json(healthPayload()));

  app.get("/", (_req, res) => sendHtml(res, "index.html"));
  app.get("/dashboard", (_req, res) => sendHtml(res, "dashboard.html"));
  app.get("/status/:siteId", (_req, res) => sendHtml(res, "status.html"));
  app.get("/billing/success", (_req, res) => sendHtml(res, "billing-success.html"));
  app.get("/billing/cancel", (_req, res) => sendHtml(res, "billing-cancel.html"));

  app.get("/api/sites", (_req, res) => {
    const state = readState();
    const sites = state.sites.map((site) => {
      const latest = getLatestCheck(site.id);
      return {
        ...site,
        status: siteStatus(latest, config.sslWarnDays),
        latest,
        statusUrl: `/status/${site.id}`
      };
    });
    res.json({
      sites,
      sslWarnDays: config.sslWarnDays,
      managed: isManagedActive(),
      siteLimit: getSiteLimit()
    });
  });

  app.get("/api/sites/:siteId/status", (req, res) => {
    const site = getSite(req.params.siteId);
    if (!site) return res.status(404).json({ error: "Site not found" });
    const latest = getLatestCheck(site.id);
    res.json({
      clientName: site.clientName,
      url: site.url,
      status: siteStatus(latest, config.sslWarnDays),
      latest,
      checkedAt: latest?.checkedAt || null
    });
  });

  app.post("/api/sites", (req, res) => {
    const parsed = siteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const state = readState();
    const limit = getSiteLimit();
    if (state.sites.length >= limit) {
      return res.status(403).json({
        error: `Site limit reached (${limit}). Upgrade to Managed Cloud for unlimited sites.`
      });
    }

    const site = {
      id: `site_${crypto.randomBytes(6).toString("hex")}`,
      ...parsed.data,
      createdAt: new Date().toISOString()
    };
    addSite(site);
    res.status(201).json({ site, statusUrl: `/status/${site.id}` });
  });

  app.patch("/api/sites/:siteId", (req, res) => {
    const parsed = siteSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const site = updateSite(req.params.siteId, parsed.data);
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json({ site });
  });

  app.delete("/api/sites/:siteId", (req, res) => {
    removeSite(req.params.siteId);
    res.json({ ok: true });
  });

  app.get("/api/summary", (_req, res) => {
    const state = readState();
    let healthy = 0;
    let down = 0;
    let sslWarning = 0;
    let unknown = 0;

    for (const site of state.sites) {
      const latest = getLatestCheck(site.id);
      const status = siteStatus(latest, config.sslWarnDays);
      if (status === "healthy") healthy += 1;
      else if (status === "down") down += 1;
      else if (status === "ssl_warning") sslWarning += 1;
      else unknown += 1;
    }

    res.json({
      total: state.sites.length,
      healthy,
      down,
      sslWarning,
      unknown,
      managed: isManagedActive(),
      recentAlerts: state.alerts.slice(0, 10)
    });
  });

  app.post("/api/stripe/checkout", async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: getManagedPriceId(), quantity: 1 }],
        success_url: `${config.appUrl}/billing/success`,
        cancel_url: `${config.appUrl}/billing/cancel`,
        metadata: { product: "site-pulse-managed" }
      });
      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
};

export const startServer = () => {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`SitePulse running at http://localhost:${config.port}`);
    if (!process.env.VERCEL) {
      startScheduler();
    }
  });
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  startServer();
}
