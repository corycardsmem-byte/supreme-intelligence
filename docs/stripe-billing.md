# Stripe billing integration

Subscriptions and monetization are designed to connect to the owner's Stripe account. The repository does not contain Stripe credentials; configure them as deployment secrets.

## Required environment variables

```bash
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_APP_URL=https://your-production-domain.example
```

Create Stripe Products and recurring Prices in the owner's Stripe Dashboard. Pass the selected recurring Price ID to:

```http
POST /billing/checkout
Content-Type: application/json

{"customerEmail":"customer@example.com","priceId":"price_..."}
```

The API returns a hosted Checkout URL. Configure the Stripe webhook endpoint as:

```text
https://your-api-domain.example/billing/webhook
```

Subscribe to at least:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Important

- Use test-mode keys until the complete purchase, renewal, cancellation, and failed-payment flows pass.
- Never commit keys to the repository or send secret keys in chat.
- The webhook endpoint must receive the raw request body so Stripe signature verification remains valid.
- Production subscription state should be persisted to the application database and associated with an authenticated user.
- Before launch, add idempotency handling and durable processing for webhook events.
