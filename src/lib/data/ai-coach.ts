// src/lib/data/ai-coach.ts
import { createClient } from '@/utils/supabase/server';

export async function getLinkedWorkouts(userId: string, programId: string, phaseIndex: number, weekIndex: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('workout_groups')
        .select('linked_program_phase_index, linked_program_week_index, linked_program_day_of_week, created_at')
        .eq('user_id', userId)
        .eq('linked_program_id', programId)
        .eq('linked_program_phase_index', phaseIndex)
        .eq('linked_program_week_index', weekIndex)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching linked workouts for adherence:', error);
        return { success: false, error: 'Failed to fetch linked workouts' };
    }
    return { success: true, data };
}

export async function getUserActivitySummary(userId: string, periodDays: number) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_user_activity_summary', {
        user_id_param: userId,
        period_days_param: periodDays
    });

    if (error) {
        console.error(`Error fetching activity summary for period ${periodDays}:`, error);
        return { success: false, error: `Unable to fetch your activity data for the last ${periodDays} days. Please try again.` };
    }
    return { success: true, data };
}

export async function getCachedAICoachRecommendation(cacheKey: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_coach_cache')
        .select('recommendation, expires_at')
        .eq('cache_key', cacheKey)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.warn('AI Coach: Error fetching from cache:', error.message);
    }
    return { success: true, data };
}

export async function cacheAICoachRecommendation(cacheKey: string, userId: string, recommendation: any, hashedDataInput: string) {
    const supabase = await createClient();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    const { error } = await supabase.from('ai_coach_cache').upsert(
        {
            cache_key: cacheKey,
            user_id: userId,
            recommendation: recommendation,
            hashed_data_input: hashedDataInput,
            created_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
        },
        {
            onConflict: 'cache_key',
        }
    );

    if (error) {
        console.error('AI Coach: Failed to store recommendation in cache:', error.message);
    }
}
