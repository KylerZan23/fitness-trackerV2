# ADR-001: Add Primary Training Focus and Experience Level to Profiles

**Date**: YYYY-MM-DD
**Status**: Proposed

## Context

The AI Personal Coach feature requires more detailed information about users to provide tailored advice and plans. Specifically, understanding a user's main training objective and their general experience level is crucial for personalizing recommendations. The existing `profiles` table does not store this information.

## Decision

We will add two new columns to the `public.profiles` table in Supabase:

1.  `primary_training_focus` (TEXT, NULLABLE): To store the user's primary area of training concentration.
    - Examples: "General Fitness", "Bodybuilding", "Powerlifting", "Weight Loss", "Endurance", "Athletic Performance", "Beginner Strength", "Other".
2.  `experience_level` (TEXT, NULLABLE): To store the user's self-assessed fitness experience.
    - Examples: "Beginner (<6 months)", "Intermediate (6mo-2yr)", "Advanced (2+ years)".

Both fields will be initially nullable to accommodate existing users and allow users to optionally provide this information.

The SQL for this change is:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_training_focus TEXT;

COMMENT ON COLUMN public.profiles.primary_training_focus
IS 'Stores the user''s primary training focus, e.g., "General Fitness", "Bodybuilding", "Powerlifting", "Weight Loss", "Endurance", "Athletic Performance".';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS experience_level TEXT;

COMMENT ON COLUMN public.profiles.experience_level
IS 'Stores the user''s fitness experience level, e.g., "Beginner", "Intermediate", "Advanced".';
```

The profile page UI (`src/app/profile/page.tsx`) will be updated to allow users to select and save these values.

## Consequences

**Positive**:

- The AI Personal Coach can generate more specific and relevant recommendations.
- User profiles will be more comprehensive.
- Allows for better user segmentation and targeted content/features in the future.

**Negative**:

- Slight increase in database storage.
- Requires UI changes to collect this new information.

**Mitigation for Negatives**:

- The additional storage is minimal for text fields.
- UI changes are part of the planned feature enhancement.

## Alternatives Considered

1.  **Storing as JSON in an existing `preferences` column**:
    - Rejected because these are common, structured data points that benefit from being first-class columns for easier querying and indexing if needed in the future.
2.  **Using ENUM types instead of TEXT**:
    - Considered, but TEXT provides more flexibility for adding/modifying options in the application layer without requiring database schema migrations for every change to the option list. The application will enforce the allowed values through dropdowns.

---

_This ADR documents the decision to enhance the user profile schema for the AI Personal Coach feature._
