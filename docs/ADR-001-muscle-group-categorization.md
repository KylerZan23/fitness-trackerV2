# ADR-001: Muscle Group Categorization for Workouts

## Date: 2025-03-01

## Status: Accepted

## Context

Our fitness tracking application needs to organize workouts by muscle groups to enhance the user experience and provide more meaningful insights. Users need to be able to filter and select exercises based on specific muscle groups they want to target.

## Decision

We have decided to:

1. **Add muscle group categorization** to our workout data model
    - Add a `muscle_group` column to the `workouts` table
    - Use a predefined set of muscle group categories: Legs, Chest, Back, Shoulders, Arms, Core, Cardio, and Other
    - Automatically classify exercises into these muscle groups based on exercise names

2. **Create a muscle group-based UI** for workout selection
    - Implement a muscle group filter component
    - Create an exercise selector that displays exercises by muscle group
    - Enhance the workout form to use this new selection interface

3. **Enhance our database schema and API**
    - Add a database trigger to automatically populate the muscle group column
    - Update API functions to support filtering by muscle group
    - Maintain backward compatibility with existing clients

## Consequences

### Positive

- Users can easily find exercises that target specific muscle groups
- Workout data becomes more structured and easier to analyze
- The application can provide more relevant insights and suggestions
- UI becomes more intuitive for exercise selection
- Future features like muscle group-specific analytics become possible

### Negative

- The database schema changes require migration for existing data
- Exercise classification is based on name pattern matching which might be imperfect
- Additional complexity in the UI and API layers
- Edge cases with uncommon exercise names might be categorized incorrectly

## Implementation Details

1. **Database Changes**
   - Add `muscle_group` column to `workouts` table
   - Create a trigger function to automatically categorize exercises
   - Populate existing workout records with appropriate muscle groups

2. **Frontend Components**
   - Create a `MuscleGroupSelector` component for filtering
   - Implement an `ExerciseSelector` component with categorized exercises
   - Update the workout form to utilize these components

3. **API Changes**
   - Enhance `logWorkout` function to include muscle group information
   - Update `getWorkouts` and `getWorkoutStats` to support muscle group filtering

## Alternatives Considered

1. **Manual Tagging**: Having users manually tag exercises with muscle groups
   - Rejected due to increased user effort and inconsistent categorization

2. **Complex Many-to-Many Relationship**: Creating separate tables for exercises and muscle groups
   - Rejected due to added complexity for the current requirements
   - May be reconsidered in the future if more detailed exercise cataloging is needed

3. **Third-party Exercise Database**: Using an external exercise database with predefined categories
   - Rejected due to integration complexity and potential costs
   - May be considered in the future to improve exercise classification 