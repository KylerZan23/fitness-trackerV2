# ADR-017: Stripe Integration Database Schema

## Status
Accepted

## Context
The application's subscription management functionality requires integration with Stripe for payment processing and customer management. The existing code in `src/lib/data/stripe.ts` and `src/app/_actions/stripeActions.ts` attempts to access `stripe_customer_id` and `stripe_subscription_id` columns in the profiles table, but these columns were missing from the database schema.

## Decision
Add the missing Stripe integration columns to the profiles table to support subscription management functionality.

## Consequences

### Positive
- Enables Stripe customer and subscription management
- Fixes the "Manage Subscription" button functionality on the profile page
- Provides proper database structure for subscription-based access control
- Includes helper functions for efficient Stripe operations
- Adds proper indexing for performance

### Negative
- Requires database migration to be applied
- Adds complexity to the profiles table schema
- Introduces dependency on Stripe API for subscription management

### Neutral
- Maintains backward compatibility with existing data
- Uses `IF NOT EXISTS` clauses to prevent conflicts
- Includes proper documentation and comments

## Implementation Details

### Migration File
- **File**: `supabase/migrations/20250129000000_add_stripe_columns_to_profiles.sql`
- **Columns Added**:
  - `stripe_customer_id VARCHAR(255)` - Stripe customer ID for billing
  - `stripe_subscription_id VARCHAR(255)` - Stripe subscription ID for active subscriptions

### Database Optimizations
- Indexes created for efficient queries on Stripe columns
- Unique constraint on `stripe_customer_id` to prevent duplicates
- Helper functions for common Stripe operations

### Helper Functions
- `get_stripe_customer_id(UUID)` - Retrieve customer ID for a user
- `update_stripe_customer_id(UUID, VARCHAR(255))` - Update customer ID for a user

## Related Changes
- Updated `docs/implementation_plans/subscription-based-access-control.md` to reflect completed migration
- Existing code in `src/lib/data/stripe.ts` and `src/app/_actions/stripeActions.ts` will now work correctly

## Migration Instructions
1. Go to Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/20250129000000_add_stripe_columns_to_profiles.sql`

## Future Considerations
- Monitor Stripe API usage and rate limits
- Consider implementing webhook handling for subscription events
- Plan for subscription tier upgrades/downgrades
- Implement proper error handling for Stripe API failures 