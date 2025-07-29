// src/app/api/stripe/webhooks/route.ts
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getServerEnv } from '@/lib/env';

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET
} = getServerEnv();

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from('profiles')
        .update({
          is_premium: true,
          stripe_subscription_id: session.subscription,
        })
        .eq('stripe_customer_id', session.customer);
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('profiles')
        .update({ is_premium: false })
        .eq('stripe_subscription_id', subscription.id);
      break;
    // Add other cases as needed (e.g., payment_failed)
  }

  return new Response(null, { status: 200 });
}