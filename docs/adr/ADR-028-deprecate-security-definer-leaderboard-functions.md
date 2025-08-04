# ADR-028: Deprecate SECURITY DEFINER Leaderboard Functions

-   **Status:** Accepted
-   **Date:** 2023-10-27
-   **Deciders:** AI Assistant

## Context and Problem Statement

The e1RM leaderboard was powered by two SQL functions, `get_strength_leaderboard` and `get_user_rank_for_lift`, that used `SECURITY DEFINER`. This `SECURITY DEFINER` clause allowed the functions to bypass Row Level Security (RLS) policies, which was necessary to calculate rankings across all users.

However, using `SECURITY DEFINER` is a significant security risk. A vulnerability in the function's code could be exploited to perform actions with the function owner's elevated privileges, potentially leading to unauthorized data access or modification.

The goal is to refactor the leaderboard to remove these `SECURITY DEFINER` functions, thereby enhancing the security of the application.

## Decision Drivers

-   **Security:** The primary driver is to eliminate the security risks associated with `SECURITY DEFINER`.
-   **Consistency:** The 1RM leaderboard already uses a direct query pattern. This change will make the e1RM leaderboard consistent with that implementation.
-   **Maintainability:** Direct queries in the application code are often easier to debug and maintain than complex SQL functions.

## Considered Options

1.  **Retain `SECURITY DEFINER` functions:** This option was rejected due to the inherent security risks.
2.  **Create a materialized view:** This would involve creating a view that pre-calculates the leaderboard. While this could improve performance, it adds complexity and still requires a privileged process to refresh the view.
3.  **Use a direct query with a specific RLS policy:** This involves creating a new, narrowly scoped RLS policy that exposes only the necessary data from the `workouts` table to authenticated users. The application code then performs the leaderboard calculation.

## Decision Outcome

The chosen option is to **use a direct query with a specific RLS policy**.

This approach provides the best balance of security, performance, and maintainability. It eliminates the `SECURITY DEFINER` risk by restricting data access at the database level, ensuring that the application can only read the specific columns needed for the leaderboard.

The implementation involves:
1.  Creating a new read-only RLS policy on the `workouts` table.
2.  Refactoring the `leaderboardActions.ts` file to replace the RPC calls with direct Supabase queries.
3.  Dropping the `get_strength_leaderboard` and `get_user_rank_for_lift` functions from the database.

This change aligns with security best practices and improves the overall architecture of the application.
