import Stripe from "stripe";
import { config } from "../src/config.js";

if (!config.stripeSecretKey) {
  console.error("Missing STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = new Stripe(config.stripeSecretKey);
const productName = "SitePulse Managed Cloud";
const lookupKey = "sitepulse_managed_monthly_v1";
const amountUsd = config.managedMonthlyUsd;

const getOrCreateProduct = async () => {
  const existing = await stripe.products.list({ active: true, limit: 100 });
  const found = existing.data.find((item) => item.name === productName);
  if (found) return found;
  return stripe.products.create({
    name: productName,
    description: "Managed hosting for SitePulse — unlimited sites + status pages"
  });
};

const getOrCreatePrice = async (productId) => {
  const priceList = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1
  });
  if (priceList.data.length > 0) return priceList.data[0];
  return stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: Math.round(amountUsd * 100),
    recurring: { interval: "month" },
    lookup_key: lookupKey,
    nickname: "managed-monthly"
  });
};

const run = async () => {
  const product = await getOrCreateProduct();
  const price = await getOrCreatePrice(product.id);
  console.log("Stripe setup complete");
  console.log(`Product: ${product.id}`);
  console.log(`STRIPE_PRICE_MANAGED=${price.id}`);
  console.log(`\nAdd to .env:\nSTRIPE_SECRET_KEY=${config.stripeSecretKey.slice(0, 12)}...`);
  console.log(`STRIPE_PRICE_MANAGED=${price.id}`);
  console.log("STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe dashboard or setup-webhook)");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
