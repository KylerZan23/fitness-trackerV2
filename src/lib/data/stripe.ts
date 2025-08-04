// src/lib/data/stripe.ts
import { createClient } from '@/utils/supabase/server';

export async function getStripeCustomerId(userId: string): Promise<{ success: boolean; customerId?: string | null; error?: string }> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching Stripe customer ID:', error);
        return { success: false, error: 'Failed to fetch Stripe customer ID.' };
    }
    return { success: true, customerId: data?.stripe_customer_id };
}

export async function updateStripeCustomerId(userId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

    if (error) {
        console.error('Error updating Stripe customer ID:', error);
        return { success: false, error: 'Failed to update Stripe customer ID.' };
    }
    return { success: true };
}
