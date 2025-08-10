## Stripe Pro Tier Wiring (001)

### Goal
- Keep the 7-day free trial as Premium (Standard) access only.
- Allow users to subscribe to Pro via a Stripe price ID (monthly).
- Persist `subscription_tier` based on purchased plan.

### Scope
- No change to trial behavior: trial grants full Standard/Premium access, not Pro.
- Add environment variables for Pro monthly price (public + server).
- Set `plan_tier` metadata on Stripe Checkout subscription creation.
- Map Stripe events to `profiles.subscription_tier` and `is_premium`.

### Changes
1. Environment
   - Add `STRIPE_PRICE_ID_PRO_MONTHLY` and `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY` to `src/lib/env/schemas.ts`.

2. Pricing UI
   - Update `src/app/pricing/page.tsx` Pro plan button to use `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY`.
   - Ensure Pro price displays $14.99/mo.

3. Checkout Session Creation
   - Update `src/app/_actions/stripeActions.ts` to infer `plan_tier` from price ID and set it in `subscription_data.metadata`.

4. Webhooks
   - Update `src/app/api/stripe/webhooks/route.ts`:
     - On `checkout.session.completed`, set `is_premium = true` and `subscription_tier = 'pro' | 'standard'` based on `subscription.metadata.plan_tier` or price ID.
     - Handle `customer.subscription.updated` similarly.
     - On `customer.subscription.deleted` or `invoice.payment_failed`, set `is_premium = false`, `subscription_tier = 'trial'` and clear `stripe_subscription_id`.

### Out of Scope
- Pro annual pricing wiring (can be added later with analogous env vars).
- Additional premium route gating changes.

### Validation
- Manual test: start trial → confirm Standard features accessible and Pro gated.
- Subscribe with Standard price → `profiles.subscription_tier = 'standard'`, premium features accessible, Pro gated.
- Subscribe with Pro price → `profiles.subscription_tier = 'pro'`, Pro features accessible.
- Cancel subscription → `is_premium = false`, `subscription_tier = 'trial'`.

### Rollback
- Revert edited files and remove new env variables.


