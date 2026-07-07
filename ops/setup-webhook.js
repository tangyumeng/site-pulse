import Stripe from "stripe";
import { config } from "../src/config.js";

if (!config.stripeSecretKey) {
  console.error("Missing STRIPE_SECRET_KEY");
  process.exit(1);
}

if (!config.appUrl || !config.appUrl.startsWith("https://")) {
  console.error("APP_URL must be a public https URL before creating a Stripe webhook.");
  process.exit(1);
}

const stripe = new Stripe(config.stripeSecretKey);
const webhookUrl = `${config.appUrl}/api/stripe/webhook`;
const description = "site-pulse-managed";

const run = async () => {
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const managed = existing.data.filter((e) => e.description === description);
  const exact = managed.find((e) => e.url === webhookUrl);

  if (exact) {
    console.log("Webhook endpoint already exists");
    console.log(`WEBHOOK_ENDPOINT_ID=${exact.id}`);
    console.log("Keep existing STRIPE_WEBHOOK_SECRET in .env");
    return;
  }

  for (const stale of managed) {
    if (stale.url !== webhookUrl) {
      await stripe.webhookEndpoints.del(stale.id);
      console.log(`Removed stale webhook: ${stale.url}`);
    }
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    description,
    enabled_events: ["checkout.session.completed", "customer.subscription.deleted"]
  });

  console.log("Webhook endpoint created");
  console.log(`WEBHOOK_ENDPOINT_ID=${endpoint.id}`);
  console.log(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
