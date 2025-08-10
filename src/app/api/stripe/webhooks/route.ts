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

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const stripe = new Stripe(STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  console.log(`✅ Stripe event received: ${event.type}`);
  const object = event.data.object as any;
  const customerId = (object.customer ?? object.customer_id) as string;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const planTier = (subscription.metadata?.plan_tier || session.metadata?.plan_tier) as 'standard' | 'pro' | undefined;

      await supabase
        .from('profiles')
        .update({
          is_premium: true,
          subscription_tier: planTier === 'pro' ? 'pro' : 'standard',
          stripe_subscription_id: subscription.id,
        })
        .eq('stripe_customer_id', customerId);
      break; }

    case 'customer.subscription.updated': {
      const subUpdated = event.data.object as Stripe.Subscription;
      const planTier = (subUpdated.metadata?.plan_tier) as 'standard' | 'pro' | undefined;
      await supabase
        .from('profiles')
        .update({
          is_premium: subUpdated.status === 'active' || subUpdated.status === 'trialing',
          subscription_tier: planTier === 'pro' ? 'pro' : 'standard',
        })
        .eq('stripe_subscription_id', subUpdated.id);
      break; }

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      await supabase
        .from('profiles')
        .update({ is_premium: false, subscription_tier: 'trial', stripe_subscription_id: null })
        .eq('stripe_subscription_id', subscriptionDeleted.id);
      break; }
    
    // Add other event types you want to handle
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response(null, { status: 200 });
}