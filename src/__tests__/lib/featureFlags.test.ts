/**
 * Unit tests for the Feature Flags system
 * Tests the core feature flagging logic including percentage rollout, 
 * user overrides, and admin controls.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { 
  isFeatureEnabled, 
  getFeatureFlagStatus,
  clearFeatureFlagCache,
  FEATURE_FLAGS
} from '@/lib/featureFlags'
import { createMockSupabaseClient } from '../utils/mockFactories.util'

// Create mock client using factory
const mockSupabaseClient = createMockSupabaseClient()

// Add specific methods needed for feature flags tests
mockSupabaseClient.or = jest.fn(() => mockSupabaseClient)

// Mock the createClient function
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}))

describe('Feature Flags System', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearFeatureFlagCache()
    
    // Reset all mocks
    jest.clearAllMocks()
    
    // Default auth user mock
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('isFeatureEnabled', () => {
    it('should return false for non-existent flags', async () => {
      // Mock no flag found
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })

      const result = await isFeatureEnabled('user-123', 'non_existent_flag')
      expect(result).toBe(false)
    })

    it('should return true for user override enabled', async () => {
      // Mock user override found
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'override-1',
          user_id: 'user-123',
          flag_name: 'test_flag',
          is_enabled: true,
          expires_at: null
        }
      })

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(true)
    })

    it('should return false for user override disabled', async () => {
      // Mock user override found
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'override-1',
          user_id: 'user-123',
          flag_name: 'test_flag',
          is_enabled: false,
          expires_at: null
        }
      })

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(false)
    })

    it('should return true for admin override enabled', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config with admin override enabled
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: true,
          rollout_percentage: 50,
          admin_override_enabled: true,
          admin_override_disabled: null
        }
      })

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(true)
    })

    it('should return false for admin override disabled', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config with admin override disabled
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: true,
          rollout_percentage: 100,
          admin_override_enabled: null,
          admin_override_disabled: true
        }
      })

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(false)
    })

    it('should return false for globally disabled flag', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config globally disabled
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: false,
          rollout_percentage: 100,
          admin_override_enabled: null,
          admin_override_disabled: null
        }
      })

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(false)
    })

    it('should handle percentage rollout correctly', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config with 50% rollout
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: true,
          rollout_percentage: 50,
          admin_override_enabled: null,
          admin_override_disabled: null
        }
      })

      // Test with a user that should be in the 50% (deterministic based on hash)
      const result1 = await isFeatureEnabled('user-in-rollout', 'test_flag')
      const result2 = await isFeatureEnabled('user-in-rollout', 'test_flag')
      
      // Should be consistent for the same user
      expect(result1).toBe(result2)
    })

    it('should handle 0% rollout', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config with 0% rollout
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: true,
          rollout_percentage: 0,
          admin_override_enabled: null,
          admin_override_disabled: null
        }
      })

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(false)
    })

    it('should handle 100% rollout', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config with 100% rollout
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: true,
          rollout_percentage: 100,
          admin_override_enabled: null,
          admin_override_disabled: null
        }
      })

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.maybeSingle.mockRejectedValueOnce(new Error('Database connection failed'))

      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(false) // Should fail safe
    })
  })

  describe('getFeatureFlagStatus', () => {
    it('should return detailed status for user override', async () => {
      // Mock user override found
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'override-1',
          user_id: 'user-123',
          flag_name: 'test_flag',
          is_enabled: true,
          reason: 'Beta tester',
          expires_at: null,
          created_at: '2024-01-01T00:00:00Z'
        }
      })

      const status = await getFeatureFlagStatus('user-123', 'test_flag')
      
      expect(status.flagName).toBe('test_flag')
      expect(status.isEnabled).toBe(true)
      expect(status.source).toBe('user_override')
      expect(status.userOverride).toBeDefined()
      expect(status.userOverride?.reason).toBe('Beta tester')
    })

    it('should return detailed status for percentage rollout', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          description: 'Test feature flag',
          is_enabled: true,
          rollout_percentage: 25,
          admin_override_enabled: null,
          admin_override_disabled: null,
          metadata: { team: 'engineering' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      })

      const status = await getFeatureFlagStatus('user-123', 'test_flag')
      
      expect(status.flagName).toBe('test_flag')
      expect(status.source).toBe('percentage_rollout')
      expect(status.rolloutPercentage).toBe(25)
      expect(status.flagConfig).toBeDefined()
      expect(status.flagConfig?.description).toBe('Test feature flag')
    })

    it('should return correct source for admin overrides', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock flag config with admin override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: true,
          rollout_percentage: 0,
          admin_override_enabled: true,
          admin_override_disabled: null
        }
      })

      const status = await getFeatureFlagStatus('user-123', 'test_flag')
      
      expect(status.source).toBe('admin_override_enabled')
      expect(status.isEnabled).toBe(true)
    })
  })

  describe('Phoenix Pipeline Feature Flag', () => {
    it('should work with predefined Phoenix pipeline flag', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      // Mock Phoenix pipeline flag config
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'phoenix-flag',
          flag_name: FEATURE_FLAGS.PHOENIX_PIPELINE_ENABLED,
          description: 'Enable the new Phoenix generation pipeline',
          is_enabled: true,
          rollout_percentage: 10,
          admin_override_enabled: null,
          admin_override_disabled: null
        }
      })

      const result = await isFeatureEnabled('user-123', FEATURE_FLAGS.PHOENIX_PIPELINE_ENABLED)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Edge Cases', () => {
    it('should handle expired user overrides', async () => {
      // Mock expired user override
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null })
      
      const result = await isFeatureEnabled('user-123', 'test_flag')
      expect(result).toBe(false)
    })

    it('should handle null/undefined inputs gracefully', async () => {
      const result1 = await isFeatureEnabled('', 'test_flag')
      const result2 = await isFeatureEnabled('user-123', '')
      
      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })

    it('should maintain consistent results for same user/flag combination', async () => {
      // Mock no user override
      mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null })
      
      // Mock flag config
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: {
          id: 'flag-1',
          flag_name: 'test_flag',
          is_enabled: true,
          rollout_percentage: 50,
          admin_override_enabled: null,
          admin_override_disabled: null
        }
      })

      const result1 = await isFeatureEnabled('consistent-user', 'test_flag')
      const result2 = await isFeatureEnabled('consistent-user', 'test_flag')
      
      expect(result1).toBe(result2)
    })
  })
})

describe('Feature Flag Cache', () => {
  it('should cache flag configurations', async () => {
    // Mock responses in order: user override (null), flag config, user override again
    mockSupabaseClient.maybeSingle
      .mockResolvedValueOnce({ data: null })  // First call: no user override
      .mockResolvedValueOnce({  // Second call: flag config
        data: {
          id: 'flag-1',
          flag_name: 'cached_flag',
          is_enabled: true,
          rollout_percentage: 100
        }
      })
      .mockResolvedValueOnce({ data: null })  // Third call: no user override again

    // First call should hit database
    await isFeatureEnabled('user-123', 'cached_flag')
    
    // Second call should use cache for flag config, but still check user override
    await isFeatureEnabled('user-123', 'cached_flag')
    
    // Should have been called 3 times: 2 for first call (user + flag), 1 for second call (user only)
    expect(mockSupabaseClient.maybeSingle).toHaveBeenCalledTimes(3)
  })

  it('should clear cache when requested', () => {
    expect(() => clearFeatureFlagCache()).not.toThrow()
  })
})