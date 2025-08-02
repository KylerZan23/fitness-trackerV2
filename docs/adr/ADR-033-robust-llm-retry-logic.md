# ADR-033: Robust LLM API Communication with Retry Mechanism

**Status:** Accepted

**Date:** 2024-07-25

## Context

The AI program generation Edge Function, located at `supabase/functions/generate-program/index.ts`, is a critical component responsible for creating personalized user workout plans. Its primary dependency is an API call to an external Large Language Model (LLM) provider (currently OpenAI).

The previous implementation of the `callLLMAPI` function was simplistic, executing only a single `fetch` request. This design presented a significant reliability risk. Transient issues such as temporary network outages, brief API unavailability, or minor service degradations would lead to an immediate and permanent failure of the program generation process. This brittle interaction resulted in a poor user experience and unnecessary support load.

## Decision

To enhance the resilience and reliability of the program generation feature, we have implemented a retry mechanism with exponential backoff directly within the `callLLMAPI` function.

The key parameters of this mechanism are:
-   **Maximum Retries:** The function will attempt the API call up to 3 times.
-   **Initial Delay:** The first retry occurs after a 1-second delay.
-   **Backoff Strategy:** The delay doubles after each subsequent failure (1s, 2s). This exponential backoff strategy is designed to respectfully handle API load during periods of instability while attempting to recover from the error.

If the API call is not successful after all attempts have been exhausted, the function will cease retries, log the final error, and return a failure state, which is then propagated to the database to mark the generation job as 'failed'.

## Consequences

### Positive
-   **Increased Reliability:** The system can now automatically recover from transient, short-lived errors from the LLM API, significantly increasing the success rate of program generations.
-   **Improved User Experience:** Users are less likely to encounter a failed program generation due to temporary service flakes that are outside of our control.
-   **Reduced Operational Noise:** Fewer failed jobs will be logged for transient issues, allowing developers to focus on more significant, persistent errors.

### Negative
-   **Increased Latency on Hard Failures:** In a scenario where the LLM API is experiencing a prolonged outage, the function will take longer to report a failure (a total of 3 seconds of delay in the current configuration). However, given that this is an asynchronous background process, this delay has no immediate impact on the user-facing experience, as they are already shown a "processing" state.

### Neutral
-   This change is fully encapsulated within the `callLLMAPI` function. The function's public interface remains unchanged, requiring no modifications to its callers.
-   The core logic for prompt construction and JSON response parsing is not affected.

---

This change represents a move towards more robust and fault-tolerant interactions with external services, acknowledging their potential for intermittent failures.