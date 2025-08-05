/**
 * Feature Flags Service
 * 
 * Provides a robust feature flagging system for gradual rollouts and A/B testing.
 * Supports user-level overrides, percentage-based rollouts, and admin controls.
 * 
 * Usage:
 * ```typescript
 * const isEnabled = await isFeatureEnabled(userId, 'phoenix_pipeline_enabled');
 * if (isEnabled) {
 *   // Use new feature
 * } else {
 *   // Use legacy feature
 * }
 * ```
 */

import { createClient } from '@/utils/supabase/server';
import { createHash } from 'crypto';

export interface FeatureFlagConfig {
  id: string;
  flagName: string;
  description?: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  adminOverrideEnabled?: boolean;
  adminOverrideDisabled?: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserFeatureOverride {
  id: string;
  userId: string;
  flagName: string;
  isEnabled: boolean;
  reason?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface FeatureFlagStatus {
  flagName: string;
  isEnabled: boolean;
  source: 'user_override' | 'admin_override_enabled' | 'admin_override_disabled' | 'percentage_rollout' | 'global_enabled' | 'global_disabled' | 'flag_not_found';
  rolloutPercentage?: number;
  userOverride?: UserFeatureOverride;
  flagConfig?: FeatureFlagConfig;
}

// Cache for feature flag configurations to reduce database hits
const flagConfigCache = new Map<string, { config: FeatureFlagConfig; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Check if a feature flag is enabled for a specific user
 * Uses a hierarchical approach: user override > admin override > percentage rollout > global setting
 */
export async function isFeatureEnabled(
  userId: string,
  flagName: string
): Promise<boolean> {
  try {
    const status = await getFeatureFlagStatus(userId, flagName);
    return status.isEnabled;
  } catch (error) {
    console.error(`[FeatureFlags] Error checking flag ${flagName} for user ${userId}:`, error);
    // Fail safe: return false for unknown flags
    return false;
  }
}

/**
 * Get detailed feature flag status for a user including the reason why it's enabled/disabled
 */
export async function getFeatureFlagStatus(
  userId: string,
  flagName: string
): Promise<FeatureFlagStatus> {
  const supabase = await createClient();
  
  try {
    // Step 1: Check for user-specific override
    const { data: userOverride } = await supabase
      .from('user_feature_overrides')
      .select('*')
      .eq('user_id', userId)
      .eq('flag_name', flagName)
      .or('expires_at.is.null,expires_at.gt.now()')
      .maybeSingle();

    if (userOverride) {
      return {
        flagName,
        isEnabled: userOverride.is_enabled,
        source: 'user_override',
        userOverride: mapUserOverride(userOverride)
      };
    }

    // Step 2: Get flag configuration
    const flagConfig = await getFeatureFlagConfig(flagName);
    
    if (!flagConfig) {
      return {
        flagName,
        isEnabled: false,
        source: 'flag_not_found'
      };
    }

    // Step 3: Check admin overrides
    if (flagConfig.adminOverrideEnabled === true) {
      return {
        flagName,
        isEnabled: true,
        source: 'admin_override_enabled',
        flagConfig
      };
    }

    if (flagConfig.adminOverrideDisabled === true) {
      return {
        flagName,
        isEnabled: false,
        source: 'admin_override_disabled',
        flagConfig
      };
    }

    // Step 4: Check global enabled status
    if (!flagConfig.isEnabled) {
      return {
        flagName,
        isEnabled: false,
        source: 'global_disabled',
        rolloutPercentage: flagConfig.rolloutPercentage,
        flagConfig
      };
    }

    // Step 5: Apply percentage rollout
    const isInRollout = isUserInPercentageRollout(userId, flagName, flagConfig.rolloutPercentage);
    
    return {
      flagName,
      isEnabled: isInRollout,
      source: 'percentage_rollout',
      rolloutPercentage: flagConfig.rolloutPercentage,
      flagConfig
    };

  } catch (error) {
    console.error(`[FeatureFlags] Error getting flag status for ${flagName}:`, error);
    return {
      flagName,
      isEnabled: false,
      source: 'flag_not_found'
    };
  }
}

/**
 * Get feature flag configuration with caching
 */
export async function getFeatureFlagConfig(flagName: string): Promise<FeatureFlagConfig | null> {
  // Check cache first
  const cached = flagConfigCache.get(flagName);
  if (cached && cached.expiry > Date.now()) {
    return cached.config;
  }

  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', flagName)
      .maybeSingle();

    if (error) {
      console.error(`[FeatureFlags] Database error fetching flag ${flagName}:`, error);
      return null;
    }

    if (!data) {
      return null;
    }

    const config = mapFeatureFlagConfig(data);
    
    // Cache the result
    flagConfigCache.set(flagName, {
      config,
      expiry: Date.now() + CACHE_TTL
    });

    return config;
  } catch (error) {
    console.error(`[FeatureFlags] Error fetching flag config for ${flagName}:`, error);
    return null;
  }
}

/**
 * Create or update a user-specific feature flag override
 */
export async function setUserFeatureOverride(
  userId: string,
  flagName: string,
  isEnabled: boolean,
  reason?: string,
  expiresAt?: Date
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('user_feature_overrides')
      .upsert({
        user_id: userId,
        flag_name: flagName,
        is_enabled: isEnabled,
        reason,
        expires_at: expiresAt?.toISOString()
      }, {
        onConflict: 'user_id,flag_name'
      });

    if (error) {
      console.error(`[FeatureFlags] Error setting user override:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`[FeatureFlags] Error setting user override:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Remove a user-specific feature flag override
 */
export async function removeUserFeatureOverride(
  userId: string,
  flagName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('user_feature_overrides')
      .delete()
      .eq('user_id', userId)
      .eq('flag_name', flagName);

    if (error) {
      console.error(`[FeatureFlags] Error removing user override:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`[FeatureFlags] Error removing user override:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update feature flag configuration (admin only)
 */
export async function updateFeatureFlagConfig(
  flagName: string,
  updates: {
    isEnabled?: boolean;
    rolloutPercentage?: number;
    adminOverrideEnabled?: boolean;
    adminOverrideDisabled?: boolean;
    description?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: updates.isEnabled,
        rollout_percentage: updates.rolloutPercentage,
        admin_override_enabled: updates.adminOverrideEnabled,
        admin_override_disabled: updates.adminOverrideDisabled,
        description: updates.description,
        metadata: updates.metadata,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('flag_name', flagName);

    if (error) {
      console.error(`[FeatureFlags] Error updating flag config:`, error);
      return { success: false, error: error.message };
    }

    // Clear cache for this flag
    flagConfigCache.delete(flagName);

    return { success: true };
  } catch (error) {
    console.error(`[FeatureFlags] Error updating flag config:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all feature flags (admin only)
 */
export async function getAllFeatureFlags(): Promise<FeatureFlagConfig[]> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[FeatureFlags] Error fetching all flags:`, error);
      return [];
    }

    return data?.map(mapFeatureFlagConfig) || [];
  } catch (error) {
    console.error(`[FeatureFlags] Error fetching all flags:`, error);
    return [];
  }
}

/**
 * Get user overrides for a specific flag (admin only)
 */
export async function getUserOverridesForFlag(flagName: string): Promise<UserFeatureOverride[]> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('user_feature_overrides')
      .select('*')
      .eq('flag_name', flagName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[FeatureFlags] Error fetching user overrides:`, error);
      return [];
    }

    return data?.map(mapUserOverride) || [];
  } catch (error) {
    console.error(`[FeatureFlags] Error fetching user overrides:`, error);
    return [];
  }
}

/**
 * Emergency rollback - disable a feature flag immediately for all users
 */
export async function emergencyRollback(
  flagName: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        admin_override_disabled: true,
        admin_override_enabled: null,
        metadata: {
          emergency_rollback: true,
          rollback_reason: reason,
          rollback_at: new Date().toISOString()
        },
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('flag_name', flagName);

    if (error) {
      console.error(`[FeatureFlags] Error during emergency rollback:`, error);
      return { success: false, error: error.message };
    }

    // Clear cache
    flagConfigCache.delete(flagName);

    console.log(`[FeatureFlags] Emergency rollback executed for ${flagName}: ${reason}`);
    return { success: true };
  } catch (error) {
    console.error(`[FeatureFlags] Error during emergency rollback:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Utility Functions

/**
 * Determine if a user is in the percentage rollout using consistent hashing
 */
function isUserInPercentageRollout(userId: string, flagName: string, percentage: number): boolean {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;

  // Create a consistent hash based on userId and flagName
  const hash = createHash('sha256')
    .update(userId + flagName + 'neurallift_salt')
    .digest('hex');
  
  // Convert first 8 hex characters to integer and get percentage
  const userValue = parseInt(hash.substring(0, 8), 16) % 100;
  
  return userValue < percentage;
}

/**
 * Map database row to FeatureFlagConfig interface
 */
function mapFeatureFlagConfig(row: any): FeatureFlagConfig {
  return {
    id: row.id,
    flagName: row.flag_name,
    description: row.description,
    isEnabled: row.is_enabled,
    rolloutPercentage: row.rollout_percentage,
    adminOverrideEnabled: row.admin_override_enabled,
    adminOverrideDisabled: row.admin_override_disabled,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to UserFeatureOverride interface
 */
function mapUserOverride(row: any): UserFeatureOverride {
  return {
    id: row.id,
    userId: row.user_id,
    flagName: row.flag_name,
    isEnabled: row.is_enabled,
    reason: row.reason,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}

/**
 * Clear all cached feature flag configurations (useful for testing)
 */
export function clearFeatureFlagCache(): void {
  flagConfigCache.clear();
}

/**
 * Predefined feature flag names for type safety
 */
export const FEATURE_FLAGS = {
  PHOENIX_PIPELINE_ENABLED: 'phoenix_pipeline_enabled',
  PHOENIX_PIPELINE_INTERNAL_TESTING: 'phoenix_pipeline_internal_testing'
} as const;

export type FeatureFlagName = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];