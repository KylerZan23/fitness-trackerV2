// src/app/_actions/stripeActions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getServerEnv } from '@/lib/env';

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to subscribe.' };
  }

  const { STRIPE_SECRET_KEY } = getServerEnv();

  // --- FIX IS HERE ---
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe secret key is not configured.');
    return { error: 'Payment processing is not configured on the server.' };
  }
  // --- END FIX ---

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20', // Using the latest official API version
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let stripeCustomerId = profile?.stripe_customer_id;

  // If the user doesn't have a Stripe customer ID, create one.
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabaseUUID: user.id },
    });
    stripeCustomerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${headers().get('origin')}/program?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${headers().get('origin')}/profile`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabaseUUID: user.id }
      }
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return { error: 'Stripe customer not found.' };
  }

  const { STRIPE_SECRET_KEY } = getServerEnv();
  
  // --- FIX IS HERE ---
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe secret key is not configured.');
    return { error: 'Payment processing is not configured on the server.' };
  }
  // --- END FIX ---

  const stripe = new Stripe(STRIPE_SECRET_KEY, { 
    apiVersion: '2024-06-20', // Using the latest official API version
  });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${headers().get('origin')}/profile`,
  });

  return { url: portalSession.url };
}