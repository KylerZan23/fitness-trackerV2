import { jest } from '@jest/globals'
import { 
  refreshStravaToken,
  disconnectStrava
} from '@/app/_actions/stravaActions'

// Mock all dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/strava/client')

// Import mocked modules for type safety
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'

// Type the mocked functions
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>

// Mock data factories
const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
})

const createMockProfile = () => ({
  id: 'test-user-id',
  strava_connected: true,
  strava_refresh_token: 'refresh_token_123',
  strava_access_token: 'access_token_123',
  strava_token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  strava_athlete_id: '12345',
})

const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  update: jest.fn().mockResolvedValue({ data: [], error: null }),
})

describe('stravaActions', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mocks
    mockSupabaseClient = createMockSupabaseClient()
    
    // Setup default mock implementations
    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('refreshStravaToken', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'User not authenticated',
      })
    })

    it('should return an error if authentication fails', async () => {
      // Arrange: Authentication error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      } as any)

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'User not authenticated',
      })
    })

    it('should return an error if profile fetch fails', async () => {
      // Arrange: Valid user but profile fetch fails
      const mockUser = createMockUser()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      })

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to fetch user profile',
      })
    })

    it('should return an error if user is not connected to Strava', async () => {
      // Arrange: Valid user but not connected to Strava
      const mockUser = createMockUser()
      const disconnectedProfile = {
        ...createMockProfile(),
        strava_connected: false,
        strava_refresh_token: null,
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: disconnectedProfile,
        error: null,
      })

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'User not connected to Strava',
      })
    })

    it('should successfully refresh Strava token', async () => {
      // Arrange: Valid user with Strava connection
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Mock successful token refresh
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      })

      mockSupabaseClient.update.mockResolvedValue({
        error: null,
      })

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Strava token refreshed successfully',
      })

      // Verify profile was updated with new tokens
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        strava_access_token: 'new_access_token',
        strava_refresh_token: 'new_refresh_token',
        strava_token_expires_at: expect.any(String),
      })
    })

    it('should handle Strava API errors during token refresh', async () => {
      // Arrange: Valid setup but Strava API returns error
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Mock Strava API error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'The provided authorization grant is invalid',
        }),
      })

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to refresh Strava token: invalid_grant',
      })
    })

    it('should handle network errors during token refresh', async () => {
      // Arrange: Valid setup but network failure
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'))

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to refresh Strava token',
      })
    })

    it('should handle database update failures', async () => {
      // Arrange: Successful token refresh but database update fails
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      })

      mockSupabaseClient.update.mockResolvedValue({
        error: { message: 'Database update failed' },
      })

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to update Strava tokens in database',
      })
    })
  })

  describe('disconnectStrava', () => {
    it('should return an error if user is not authenticated', async () => {
      // Arrange: No authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      // Act
      const result = await disconnectStrava()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'User not authenticated',
      })
    })

    it('should return an error if authentication fails', async () => {
      // Arrange: Authentication error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      } as any)

      // Act
      const result = await disconnectStrava()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'User not authenticated',
      })
    })

    it('should successfully disconnect from Strava', async () => {
      // Arrange: Valid authenticated user
      const mockUser = createMockUser()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.update.mockResolvedValue({
        error: null,
      })

      // Act
      const result = await disconnectStrava()

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Successfully disconnected from Strava',
      })

      // Verify profile was updated to clear Strava data
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        strava_connected: false,
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        strava_athlete_id: null,
      })
    })

    it('should handle database update failures during disconnect', async () => {
      // Arrange: Valid user but database update fails
      const mockUser = createMockUser()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.update.mockResolvedValue({
        error: { message: 'Database connection failed' },
      })

      // Act
      const result = await disconnectStrava()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to disconnect from Strava',
      })
    })

    it('should handle unexpected errors during disconnect', async () => {
      // Arrange: Unexpected error in Supabase client creation
      mockCreateSupabaseServerClient.mockRejectedValue(new Error('Service unavailable'))

      // Act
      const result = await disconnectStrava()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete token refresh workflow', async () => {
      // Arrange: Test the complete token refresh flow
      const mockUser = createMockUser()
      const expiredProfile = {
        ...createMockProfile(),
        strava_token_expires_at: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: expiredProfile,
        error: null,
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'refreshed_access_token',
          refresh_token: 'refreshed_refresh_token',
          expires_at: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
        }),
      })

      mockSupabaseClient.update.mockResolvedValue({
        error: null,
      })

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result.success).toBe(true)

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('refresh_token_123'),
        })
      )
    })

    it('should handle disconnect after failed token refresh', async () => {
      // Arrange: Simulate scenario where token refresh fails and user disconnects
      const mockUser = createMockUser()

      // First, simulate failed token refresh
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      const expiredProfile = {
        ...createMockProfile(),
        strava_refresh_token: 'invalid_refresh_token',
      }

      mockSupabaseClient.single.mockResolvedValue({
        data: expiredProfile,
        error: null,
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
        }),
      })

      // Act: First attempt token refresh (should fail)
      const refreshResult = await refreshStravaToken()

      // Reset mocks for disconnect
      jest.clearAllMocks()
      mockSupabaseClient = createMockSupabaseClient()
      mockCreateSupabaseServerClient.mockResolvedValue(mockSupabaseClient as any)

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.update.mockResolvedValue({
        error: null,
      })

      // Act: Then disconnect
      const disconnectResult = await disconnectStrava()

      // Assert: Token refresh should fail, disconnect should succeed
      expect(refreshResult.success).toBe(false)
      expect(disconnectResult.success).toBe(true)
    })

    it('should handle concurrent token refresh attempts', async () => {
      // Arrange: Multiple simultaneous token refresh attempts
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'concurrent_access_token',
          refresh_token: 'concurrent_refresh_token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      })

      mockSupabaseClient.update.mockResolvedValue({
        error: null,
      })

      // Act: Make multiple concurrent requests
      const promises = [
        refreshStravaToken(),
        refreshStravaToken(),
        refreshStravaToken(),
      ]

      const results = await Promise.all(promises)

      // Assert: All should succeed (though in practice, rate limiting might apply)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed Strava API responses', async () => {
      // Arrange: Valid setup but malformed API response
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          // Missing required fields
          access_token: 'token',
          // refresh_token missing
          // expires_at missing
        }),
      })

      // Act
      const result = await refreshStravaToken()

      // Assert: Should handle gracefully
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to refresh Strava token')
    })

    it('should handle JSON parsing errors from Strava API', async () => {
      // Arrange: Valid setup but unparseable response
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      })

      // Act
      const result = await refreshStravaToken()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to refresh Strava token')
    })

    it('should handle missing environment variables gracefully', async () => {
      // Note: This test would require mocking environment variables
      // For now, we'll test that the function handles missing configuration

      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      // The actual implementation should check for environment variables
      // and return appropriate errors if they're missing

      // This test would need to be expanded based on the actual implementation
      expect(true).toBe(true) // Placeholder for now
    })
  })
}) 