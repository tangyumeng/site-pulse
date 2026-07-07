import Stripe from "stripe";
import { config, hasStripe } from "./config.js";

let stripeClient = null;

export const getStripe = () => {
  if (!hasStripe()) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey);
  }
  return stripeClient;
};

export const getManagedPriceId = () => config.stripePriceManaged;
