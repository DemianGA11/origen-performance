import "server-only";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "Falta configurar STRIPE_SECRET_KEY en .env.local"
  );
}

export const stripe = new Stripe(secretKey);