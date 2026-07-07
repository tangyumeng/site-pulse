import { config, hasStripe, hasEmailAlerts, hasTelegramAlerts } from "../src/config.js";

const checks = [
  { key: "STRIPE_SECRET_KEY", ok: Boolean(config.stripeSecretKey), required: false },
  { key: "STRIPE_WEBHOOK_SECRET", ok: Boolean(config.stripeWebhookSecret), required: false },
  { key: "STRIPE_PRICE_MANAGED", ok: Boolean(config.stripePriceManaged), required: false },
  { key: "APP_URL", ok: Boolean(config.appUrl && !config.appUrl.includes("localhost")), required: false },
  { key: "TELEGRAM", ok: hasTelegramAlerts(), required: false },
  { key: "EMAIL", ok: hasEmailAlerts(), required: false }
];

console.log("=== SitePulse Auth Check ===\n");

for (const check of checks) {
  console.log(`${check.ok ? "✓" : "○"} ${check.key}`);
}

if (!hasStripe()) {
  console.log("\nStripe: not configured (self-hosted free mode OK)");
} else if (!config.stripeWebhookSecret) {
  console.log("\n⚠ Stripe keys present but webhook secret missing");
  process.exitCode = 1;
} else {
  console.log("\n✓ Stripe ready for Managed Cloud checkout");
}

if (!hasTelegramAlerts() && !hasEmailAlerts()) {
  console.log("○ Alerts: console only (configure Telegram or SMTP for production)");
}
