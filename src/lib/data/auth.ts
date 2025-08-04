// src/lib/data/auth.ts
import { createClient } from '@/utils/supabase/server';

export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Authentication error:', error);
        return { success: false, error: `Authentication error: ${error.message}` };
    }

    if (!user) {
        console.error('No user found');
        return { success: false, error: 'User not authenticated' };
    }

    return { success: true, user };
}
