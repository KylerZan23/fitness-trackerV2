// src/app/_actions/stripeActions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { getStripeCustomerId, updateStripeCustomerId } from '@/lib/data/stripe';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getServerEnv } from '@/lib/env';

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to subscribe.' };
  }

  const {
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID_MONTHLY,
    STRIPE_PRICE_ID_ANNUAL,
    STRIPE_PRICE_ID_PRO_MONTHLY,
    STRIPE_PRICE_ID_PRO_ANNUAL,
  } = getServerEnv();

  // --- FIX IS HERE ---
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe secret key is not configured.');
    return { error: 'Payment processing is not configured on the server.' };
  }
  // --- END FIX ---

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-09-30.acacia' as any, // Workaround for a type definition issue
  });

  const { success, customerId, error } = await getStripeCustomerId(user.id);

  if (!success) {
    return { error: error || 'Failed to get Stripe customer ID.' };
  }

  let stripeCustomerId = customerId;

  // If the user doesn't have a Stripe customer ID, create one.
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabaseUUID: user.id },
    });
    stripeCustomerId = customer.id;

    await updateStripeCustomerId(user.id, stripeCustomerId);
  }

  // Determine plan tier from price ID
  let planTier: 'standard' | 'pro' = 'standard'
  if (priceId === STRIPE_PRICE_ID_PRO_MONTHLY || priceId === STRIPE_PRICE_ID_PRO_ANNUAL) {
    planTier = 'pro'
  } else if (priceId === STRIPE_PRICE_ID_MONTHLY || priceId === STRIPE_PRICE_ID_ANNUAL) {
    planTier = 'standard'
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${(await headers()).get('origin')}/program?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${(await headers()).get('origin')}/profile`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabaseUUID: user.id, plan_tier: planTier }
      },
      metadata: { supabaseUUID: user.id, plan_tier: planTier }
    });

    return { sessionId: session.id };
  } catch (e) {
    console.error('ERROR in createCheckoutSession:', e);
    return { error: 'Failed to create checkout session.' };
  }
}

export async function createCustomerPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  const { success, customerId, error } = await getStripeCustomerId(user.id);

  if (!success) {
    return { error: error || 'Failed to get Stripe customer ID.' };
  }

  // If no Stripe customer exists, redirect to pricing page
  if (!customerId) {
    return { redirectToPricing: true };
  }

  const { STRIPE_SECRET_KEY } = getServerEnv();
  
  // --- FIX IS HERE ---
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe secret key is not configured.');
    return { error: 'Payment processing is not configured on the server.' };
  }
  // --- END FIX ---

  const stripe = new Stripe(STRIPE_SECRET_KEY, { 
    apiVersion: '2024-09-30.acacia' as any, // Workaround for a type definition issue
  });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${(await headers()).get('origin')}/profile`,
  });

  return { url: portalSession.url };
}