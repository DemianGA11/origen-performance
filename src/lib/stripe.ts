import { isPreviewEnvironment, blockedPreviewClient } from "./preview-runtime";
import "server-only";
import Stripe from "stripe";

function createCurrentStripe() {
  if (isPreviewEnvironment()) return blockedPreviewClient<Stripe>();
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Falta configurar STRIPE_SECRET_KEY en el servidor"
    );
  }

  if (process.env.VERCEL_ENV === "production" && !/^(sk|rk)_live_/.test(secretKey)) {
    throw new Error("Stripe Production requiere una clave Live de servidor.");
  }
  return new Stripe(secretKey);
}
export const stripe = createCurrentStripe();
