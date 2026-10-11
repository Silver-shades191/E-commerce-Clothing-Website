import Stripe from "stripe";

// Stripe handles card data entirely on its hosted pages, so the app never sees
// or stores card numbers. That keeps the store out of PCI scope (SAQ A).
export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
export const stripeEnabled = Boolean(stripe);
