/**
 * Intelligent Retry Fetch Utility
 * ================================
 * 
 * Provides robust retry logic for HTTP requests with exponential backoff
 * and specific handling for transient failures vs permanent errors.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 500) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 5000) */
  maxDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** HTTP status codes that should trigger retries (default: [404, 500, 502, 503, 504]) */
  retryableStatusCodes?: number[];
  /** Custom function to determine if an error should be retried */
  shouldRetry?: (error: any, attempt: number) => boolean;
  /** Enable logging for debugging (default: false in production) */
  enableLogging?: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 500, // 500ms
  maxDelay: 5000,    // 5s
  backoffMultiplier: 2,
  retryableStatusCodes: [404, 500, 502, 503, 504],
  shouldRetry: () => true,
  enableLogging: process.env.NODE_ENV === 'development'
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateDelay(
  attempt: number, 
  initialDelay: number, 
  maxDelay: number, 
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);
  return Math.max(100, cappedDelay + jitter); // Minimum 100ms
}

/**
 * Enhanced fetch with intelligent retry logic
 * 
 * @param url - URL to fetch
 * @param fetchOptions - Standard fetch options
 * @param retryOptions - Retry configuration options
 * @returns Promise with retry result containing success/failure data
 */
export async function retryFetch<T = any>(
  url: string,
  fetchOptions: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<RetryResult<T>> {
  const options = { ...DEFAULT_OPTIONS, ...retryOptions };
  const startTime = Date.now();
  let lastError: Error | null = null;

  if (options.enableLogging) {
    console.log(`[RetryFetch] Starting request to ${url} with max ${options.maxAttempts} attempts`);
  }

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      if (options.enableLogging && attempt > 1) {
        console.log(`[RetryFetch] Attempt ${attempt}/${options.maxAttempts} for ${url}`);
      }

      const response = await fetch(url, fetchOptions);

      // Success case
      if (response.ok) {
        const data = await response.json();
        const totalTime = Date.now() - startTime;

        if (options.enableLogging) {
          console.log(`[RetryFetch] ✅ Success on attempt ${attempt} after ${totalTime}ms`);
        }

        return {
          success: true,
          data,
          attempts: attempt,
          totalTime
        };
      }

      // Check if status code is retryable
      if (!options.retryableStatusCodes.includes(response.status)) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        const totalTime = Date.now() - startTime;

        if (options.enableLogging) {
          console.log(`[RetryFetch] ❌ Non-retryable error: ${response.status}`);
        }

        return {
          success: false,
          error,
          attempts: attempt,
          totalTime
        };
      }

      // Retryable status code
      const statusError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      lastError = statusError;

      if (options.enableLogging) {
        console.log(`[RetryFetch] ⚠️ Retryable error: ${response.status}`);
      }

    } catch (networkError) {
      lastError = networkError instanceof Error ? networkError : new Error(String(networkError));
      
      if (options.enableLogging) {
        console.log(`[RetryFetch] ⚠️ Network error: ${lastError.message}`);
      }
    }

    // Check custom retry logic
    if (!options.shouldRetry(lastError, attempt)) {
      if (options.enableLogging) {
        console.log(`[RetryFetch] ❌ Custom retry logic says stop at attempt ${attempt}`);
      }
      break;
    }

    // Don't delay after the last attempt
    if (attempt < options.maxAttempts) {
      const delay = calculateDelay(attempt, options.initialDelay, options.maxDelay, options.backoffMultiplier);
      
      if (options.enableLogging) {
        console.log(`[RetryFetch] ⏳ Waiting ${delay}ms before attempt ${attempt + 1}`);
      }
      
      await sleep(delay);
    }
  }

  // All attempts failed
  const totalTime = Date.now() - startTime;
  
  if (options.enableLogging) {
    console.log(`[RetryFetch] ❌ All ${options.maxAttempts} attempts failed after ${totalTime}ms`);
  }

  return {
    success: false,
    error: lastError || new Error('All retry attempts failed'),
    attempts: options.maxAttempts,
    totalTime
  };
}

/**
 * Specialized retry fetch for program API calls
 * Optimized for the specific case of newly generated programs
 */
export async function retryProgramFetch(programId: string): Promise<RetryResult<any>> {
  return retryFetch(`/api/programs/${programId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }, {
    maxAttempts: 4,        // Extra attempt for program generation case
    initialDelay: 750,     // Slightly longer initial delay
    maxDelay: 3000,        // Shorter max delay for better UX
    retryableStatusCodes: [404, 500, 502, 503], // Focus on transient errors
    enableLogging: process.env.NODE_ENV === 'development',
    shouldRetry: (error, attempt) => {
      // Special logic for program fetching
      if (error?.message?.includes('404') && attempt <= 3) {
        // Allow retries for 404s (program might still be committing)
        return true;
      }
      if (error?.message?.includes('500') && attempt <= 2) {
        // Retry server errors up to 2 times
        return true;
      }
      return false;
    }
  });
}
