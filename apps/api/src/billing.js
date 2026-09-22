import express from 'express';
import { createCheckoutSession, constructWebhookEvent } from '@supreme-intelligence/billing';

export const billingRouter = express.Router();

billingRouter.post('/checkout', async (req, res) => {
  try {
    const { customerEmail, priceId } = req.body || {};
    const origin = req.get('origin') || process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      customerEmail,
      priceId,
      successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/billing/cancelled`
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export function stripeWebhookHandler(req, res) {
  try {
    const event = constructWebhookEvent(
      req.body,
      req.headers['stripe-signature']
    );

    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed':
        console.log(`Stripe event received: ${event.type}`);
        break;
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}
