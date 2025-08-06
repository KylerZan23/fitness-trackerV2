# Implementation Plan: Deprecate SECURITY DEFINER Leaderboard Functions

**Author:** AI Assistant
**Date:** 2023-10-27

## 1. Overview

This document outlines the plan to deprecate and remove the `get_strength_leaderboard` and `get_user_rank_for_lift` SQL functions, which currently use `SECURITY DEFINER`. These functions will be replaced with direct Supabase queries from a server-side action, secured by a new, narrowly scoped Row Level Security (RLS) policy on the `workouts` table.

This change eliminates a potential security vulnerability associated with `SECURITY DEFINER` and aligns the e1RM leaderboard with the existing 1RM leaderboard's direct query pattern.

## 2. Rationale

Using `SECURITY DEFINER` functions is a security risk. A bug in such a function could be exploited to gain elevated privileges on the database. By switching to a direct query model with a specific RLS policy, we limit data exposure to only what is necessary for the leaderboard, adhering to the principle of least privilege.

## 3. Implementation Steps

### Step 1: Create a New RLS Policy on `workouts`

A new read-only RLS policy will be created on the `workouts` table for authenticated users. This policy will only expose the columns necessary for the e1RM leaderboard calculation.

-   **Policy Name:** `Allow read access for leaderboard`
-   **Table:** `workouts`
-   **Command:** `CREATE POLICY`
-   **Allowed Operation:** `SELECT`
-   **Columns:** `user_id`, `exercise_name`, `weight`, `reps`, `created_at`
-   **`USING` clause:** `auth.role() = 'authenticated'`

### Step 2: Replicate Helper Functions in TypeScript

The logic from the `calculate_e1rm` and `is_valid_for_e1rm` SQL functions will be replicated in TypeScript within `src/lib/utils/strengthCalculations.ts` or a similar utility file.

-   `calculate_e1rm(weight, reps)`: Implements the Brzycki formula.
-   `is_valid_for_e1rm(weight, reps)`: Validates that weight and reps are within the acceptable range.

### Step 3: Refactor `leaderboardActions.ts`

The functions in `src/app/_actions/leaderboardActions.ts` will be refactored to remove all calls to the deprecated RPCs.

1.  **`getLeaderboardData`:**
    -   Remove the call to `supabase.rpc('get_strength_leaderboard', ...)`
    -   Implement a direct query to the `workouts` table.
    -   The query will `SELECT` the necessary columns, `FILTER` by `exercise_name`, and `JOIN` with the `profiles` table.
    -   The application code will then process the results to find each user's best lift, calculate the e1RM, and rank the users.

2.  **`getUserRankForLift`:**
    -   Remove the call to `supabase.rpc('get_user_rank_for_lift', ...)`
    -   This function will now call the refactored `getLeaderboardData` to get the full leaderboard.
    -   It will then find the current user's ID in the returned data to determine their rank.

3.  **Dependent Functions:**
    -   `getCurrentUserRank`, `getCommonStrengthLeaderboards`, `getUserPersonalBest`, and `getOverallStrengthLeaderboard` will all be updated to use the refactored `getLeaderboardData` instead of making RPC calls.

### Step 4: Create a Database Migration

A new Supabase migration file will be created in `supabase/migrations/`.

-   The migration will contain the `CREATE POLICY` statement from Step 1.
-   It will also contain `DROP FUNCTION` statements for `get_strength_leaderboard` and `get_user_rank_for_lift`.

### Step 5: Create ADR

An Architecture Decision Record (ADR) will be created to document this change.

-   **Title:** `ADR-028-deprecate-security-definer-leaderboard-functions.md`
-   **Content:** It will explain the decision to move away from `SECURITY DEFINER` functions, the chosen alternative, and the benefits of the new approach.

## 4. Testing

After the changes are implemented, the leaderboard functionality will be manually tested to ensure:
-   The leaderboard data is accurate.
-   User ranks are calculated correctly.
-   The new RLS policy correctly restricts access to the `workouts` table.

## 5. Rollback Plan

In case of any issues, the changes can be rolled back by:
1.  Reverting the changes in `leaderboardActions.ts`.
2.  Creating a new database migration to drop the RLS policy and re-create the `SECURITY DEFINER` functions.
