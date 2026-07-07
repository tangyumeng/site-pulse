import "dotenv/config";

const defaultDataDir = process.env.VERCEL ? "/tmp/site-pulse-data" : "./data";

export const config = {
  port: Number(process.env.PORT || 4050),
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 4050}`,
  dataDir: process.env.DATA_DIR || defaultDataDir,
  checkIntervalMinutes: Number(process.env.CHECK_INTERVAL_MINUTES || 5),
  sslWarnDays: Number(process.env.SSL_WARN_DAYS || 14),
  freeSiteLimit: Number(process.env.FREE_SITE_LIMIT || 50),
  managedMonthlyUsd: Number(process.env.MANAGED_MONTHLY_USD || 9),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePriceManaged: process.env.STRIPE_PRICE_MANAGED || "",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  },
  alertEmail: process.env.ALERT_EMAIL || "",
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || ""
  }
};

export const hasStripe = () => Boolean(config.stripeSecretKey && config.stripePriceManaged);

export const hasEmailAlerts = () =>
  Boolean(config.smtp.host && config.alertEmail);

export const hasTelegramAlerts = () =>
  Boolean(config.telegram.botToken && config.telegram.chatId);
