import Stripe from 'stripe';

let stripeClient;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20'
  });

  return stripeClient;
}

export async function createCheckoutSession({ customerEmail, priceId, successUrl, cancelUrl }) {
  if (!priceId) throw new Error('A Stripe price ID is required.');

  return getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer_email: customerEmail || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { product: 'supreme-intelligence' }
    }
  });
}

export function constructWebhookEvent(payload, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }

  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
