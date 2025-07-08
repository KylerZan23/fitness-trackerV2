# ADR 007: Strava API Integration

## Status

Accepted

## Context

Users of the FitnessTracker application want to track and log their running activities, in addition to strength training. Rather than building a run-tracking system from scratch, it makes sense to integrate with Strava, which is a popular platform for tracking running, cycling, and other activities. This integration would allow users to:

1. Connect their Strava account to FitnessTracker
2. View their Strava activities within the app
3. Manually log runs to Strava when needed
4. Keep their running and strength training data in a single unified dashboard

## Decision

We will implement a Strava API integration with the following components:

1. **OAuth 2.0 Authentication Flow**:

   - Implement the authorization code flow for secure authentication
   - Store access and refresh tokens securely in the user's profile in Supabase
   - Handle token refresh automatically when tokens expire

2. **Modular API Client**:

   - Create a dedicated Strava API client module
   - Implement functions for authentication, activity retrieval, and activity creation
   - Handle API errors gracefully and provide meaningful feedback to users

3. **UI Components**:

   - Create a "Connect to Strava" component for OAuth authorization
   - Build a run list component to display activities from Strava
   - Develop a manual run logger component for logging runs to Strava

4. **Token Management**:

   - Store tokens securely in both localStorage (for immediate use) and database (for persistence)
   - Implement token refresh logic to maintain API access
   - Allow users to disconnect their Strava account when desired

5. **Database Schema Updates**:
   - Add fields to the `profiles` table for storing Strava tokens and connection status
   - `strava_access_token`: User's Strava access token
   - `strava_refresh_token`: User's Strava refresh token
   - `strava_token_expires_at`: Expiration timestamp for the access token
   - `strava_connected`: Boolean flag indicating connection status

## Consequences

### Positive

- Users can now track both strength training and running in a single application
- Leveraging Strava's robust API avoids the need to build run-tracking from scratch
- OAuth 2.0 implementation ensures secure authentication and protects user data
- Modular design allows for future expansion of Strava integration features

### Negative

- Additional complexity in the application architecture
- Dependency on an external service (Strava API) which may change or have rate limits
- Need for users to sign up for both FitnessTracker and Strava
- Additional database schema changes required

### Neutral

- Users need to authorize the application to access their Strava data
- Need to maintain secure storage of OAuth tokens
- Application needs to handle token refresh logic

## Technical Implementation Details

1. **API Module**: Created a `strava.ts` module that encapsulates all Strava API interactions
2. **Token Storage**: Implemented a `strava-token-store.ts` module for secure token management
3. **OAuth Callback**: Added a callback page to handle the OAuth redirect and token exchange
4. **UI Components**: Created reusable components for Strava connection, run display, and run logging
5. **Environment Variables**: Added configuration for Strava API credentials in the environment

## Alternatives Considered

1. **Building a custom run-tracking system**: Rejected due to complexity and time constraints
2. **Using a different fitness API**: Strava was chosen due to its popularity and comprehensive API
3. **Managing tokens in memory only**: Rejected for persistence reasons
4. **Server-side only token management**: Decided to use both client and server storage for better UX

## References

1. [Strava API Documentation](https://developers.strava.com/docs/reference/)
2. [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
3. [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
4. [Supabase Documentation](https://supabase.io/docs)
