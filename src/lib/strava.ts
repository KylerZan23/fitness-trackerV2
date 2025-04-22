/**
 * Strava API Integration
 * ------------------------------------------------
 * This module provides functionality for interacting with Strava's API
 * including OAuth authentication, token management, and activity (run) logging.
 */

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  map?: {
    id: string;
    summary_polyline: string;
  };
}

// Environment variable validation
const getEnvVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

// These will need to be added to your .env.local file
const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;

// Strava API Endpoints
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';

/**
 * Generates the Strava authorization URL to start the OAuth flow
 */
export const getStravaAuthUrl = (): string => {
  // Hardcode the client ID for now
  const clientId = 154490;
  
  const params = new URLSearchParams({
    client_id: clientId.toString(),
    redirect_uri: `${window.location.origin}/run-logger/callback`,
    response_type: 'code',
    scope: 'read,activity:read,activity:write',
    approval_prompt: 'auto'
  });
  
  return `${STRAVA_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param code Authorization code from Strava callback
 */
export const exchangeStravaCode = async (code: string): Promise<StravaTokens> => {
  // Hardcode the client ID and secret for now
  const clientId = 154490;
  const clientSecret = "cfdc62b65882e884da02724e3611b9d3ac2daae2";
  
  try {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code'
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strava token exchange failed: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at
    };
  } catch (error) {
    console.error('Error exchanging Strava code:', error);
    throw error;
  }
};

/**
 * Refreshes an expired Strava access token using the refresh token
 * @param refreshToken Strava refresh token
 */
export const refreshStravaToken = async (refreshToken: string): Promise<StravaTokens> => {
  // Hardcode the client ID and secret for now
  const clientId = 154490;
  const clientSecret = "cfdc62b65882e884da02724e3611b9d3ac2daae2";
  
  try {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strava token refresh failed: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at
    };
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    throw error;
  }
};

/**
 * Helper to ensure a valid token is used for API requests
 */
export const getValidStravaToken = async (tokens: StravaTokens): Promise<string> => {
  // Check if current token is expired (with 60 second buffer)
  const currentTime = Math.floor(Date.now() / 1000);
  
  if (tokens.expires_at <= currentTime + 60) {
    // Token is expired or about to expire, refresh it
    const newTokens = await refreshStravaToken(tokens.refresh_token);
    // You would typically store these new tokens in your database or local storage
    // For this example, we'll just return the new access token
    return newTokens.access_token;
  }
  
  // Token is still valid
  return tokens.access_token;
};

/**
 * Fetches all activities (runs) from the user's Strava account
 * @param tokens User's Strava tokens
 * @param page Page number for pagination
 * @param perPage Number of activities per page
 */
export const getStravaActivities = async (
  tokens: StravaTokens,
  page = 1,
  perPage = 30
): Promise<StravaActivity[]> => {
  try {
    const accessToken = await getValidStravaToken(tokens);
    
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    const response = await fetch(
      `${STRAVA_API_BASE_URL}/athlete/activities?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strava activities fetch failed: ${JSON.stringify(errorData)}`);
    }
    
    const activities = await response.json();
    return activities;
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    throw error;
  }
};

/**
 * Fetches a specific activity from Strava by ID
 * @param tokens User's Strava tokens
 * @param activityId ID of the activity to fetch
 */
export const getStravaActivity = async (
  tokens: StravaTokens,
  activityId: number
): Promise<StravaActivity> => {
  try {
    const accessToken = await getValidStravaToken(tokens);
    
    const response = await fetch(
      `${STRAVA_API_BASE_URL}/activities/${activityId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strava activity fetch failed: ${JSON.stringify(errorData)}`);
    }
    
    const activity = await response.json();
    return activity;
  } catch (error) {
    console.error('Error fetching Strava activity:', error);
    throw error;
  }
};

/**
 * Fetches a specific activity from Strava by ID with full polyline data
 * @param tokens User's Strava tokens
 * @param activityId ID of the activity to fetch
 */
export const getStravaActivityWithPolyline = async (
  tokens: StravaTokens,
  activityId: number
): Promise<StravaActivity> => {
  try {
    const accessToken = await getValidStravaToken(tokens);
    
    const response = await fetch(
      `${STRAVA_API_BASE_URL}/activities/${activityId}?include_all_efforts=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strava activity fetch failed: ${JSON.stringify(errorData)}`);
    }
    
    const activity = await response.json();
    return activity;
  } catch (error) {
    console.error('Error fetching Strava activity with polyline:', error);
    throw error;
  }
};

/**
 * Creates a new manual activity (run) on Strava
 * @param tokens User's Strava tokens
 * @param activityData Data for the new activity
 */
export const createStravaActivity = async (
  tokens: StravaTokens,
  activityData: {
    name: string;
    type: string;
    start_date_local: string;
    elapsed_time: number;
    description?: string;
    distance: number;
    trainer?: boolean;
    commute?: boolean;
  }
): Promise<StravaActivity> => {
  try {
    const accessToken = await getValidStravaToken(tokens);
    
    const response = await fetch(
      `${STRAVA_API_BASE_URL}/activities`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strava activity creation failed: ${JSON.stringify(errorData)}`);
    }
    
    const createdActivity = await response.json();
    return createdActivity;
  } catch (error) {
    console.error('Error creating Strava activity:', error);
    throw error;
  }
};

/**
 * Updates an existing activity on Strava
 * @param tokens User's Strava tokens
 * @param activityId ID of the activity to update
 * @param activityData Updated data for the activity
 */
export const updateStravaActivity = async (
  tokens: StravaTokens,
  activityId: number,
  activityData: {
    name?: string;
    type?: string;
    description?: string;
    trainer?: boolean;
    commute?: boolean;
  }
): Promise<StravaActivity> => {
  try {
    const accessToken = await getValidStravaToken(tokens);
    
    const response = await fetch(
      `${STRAVA_API_BASE_URL}/activities/${activityId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strava activity update failed: ${JSON.stringify(errorData)}`);
    }
    
    const updatedActivity = await response.json();
    return updatedActivity;
  } catch (error) {
    console.error('Error updating Strava activity:', error);
    throw error;
  }
}; 