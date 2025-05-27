# ADR-00X: Goals Feature and Database Schema

**Date:** $(date +%Y-%m-%d)

**Status:** Proposed

**Context:**

The application dashboard currently lacks a feature for users to set and track personal fitness goals (e.g., weekly running distance, number of workout days per week). A static example exists, but dynamic functionality is required.

**Decision:**

We will implement a dynamic goals feature allowing users to define and track progress towards various fitness objectives.

This requires:

1.  **New Database Table:** A `goals` table will be added to the Supabase database to store goal definitions.
2.  **Database Function:** A PostgreSQL function (`get_goals_with_progress`) will be created within Supabase to efficiently calculate the current progress towards goals by joining goal data with relevant workout/run data.
3.  **Backend Functions:** TypeScript functions will be added (`lib/goals.ts` or `lib/db.ts`) to interact with the `goals` table (CRUD) and call the progress calculation function.
4.  **Frontend Components:**
    - The existing `GoalsCard.tsx` will be refactored to fetch and display dynamic goal data and progress.
    - A new component (`AddGoalModal.tsx` or similar) will be created to provide a UI for users to create and edit goals.

**Schema for `goals` Table:**

| Column Name    | Data Type                  | Constraints/Notes                                        |
| :------------- | :------------------------- | :------------------------------------------------------- |
| `id`           | `uuid`                     | Primary Key, Default: `gen_random_uuid()`                |
| `user_id`      | `uuid`                     | Foreign Key -> `profiles.id`, Not Null                   |
| `metric_type`  | `text`                     | Not Null. e.g., 'weekly_distance', 'weekly_workout_days' |
| `target_value` | `numeric`                  | Not Null. The goal value.                                |
| `target_unit`  | `text`                     | e.g., 'mi', 'km', 'days', 'lbs', 'kg'                    |
| `time_period`  | `text`                     | Not Null. e.g., 'week', 'month'                          |
| `start_date`   | `timestamp with time zone` | Not Null. Start of the goal period.                      |
| `end_date`     | `timestamp with time zone` | Not Null. End of the goal period.                        |
| `label`        | `text`                     | Optional: User-defined name for the goal.                |
| `is_active`    | `boolean`                  | Default: `true`. To show/hide goals.                     |
| `created_at`   | `timestamp with time zone` | Default: `now()`                                         |
| `updated_at`   | `timestamp with time zone` | Default: `now()`                                         |

_(Row Level Security must be enabled for this table)_

**Rationale:**

- Storing goals in the database allows persistence and user-specific tracking.
- A dedicated database function for progress calculation optimizes performance by performing calculations close to the data, reducing data transfer and client-side computation.
- Separating UI concerns (display, input) into dedicated components follows good practice.

**Consequences:**

- Requires manual creation of the `goals` table and the `get_goals_with_progress` function in the Supabase environment by the developer.
- Increases complexity by adding new database interactions, backend logic, and frontend components.
- The initial implementation might support a limited set of `metric_type`s (e.g., weekly distance, weekly workout days) to manage scope.
- Future work will be needed to expand supported goal types and potentially enhance the goal creation/editing UI.
