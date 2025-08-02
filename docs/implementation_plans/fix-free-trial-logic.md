# Fix Free Trial Logic Implementation Plan

## Problem Analysis
The 7-day free trial is not working correctly - users are being marked as expired prematurely. This is likely due to timezone handling issues and inconsistent trial calculation methods.

## Root Causes Identified

### 1. Timezone Inconsistency
- **Client-side calculation**: Uses `Date.now() + 7 * 24 * 60 * 60 * 1000` (local timezone)
- **Database calculation**: Uses `NOW() + INTERVAL '7 days'` (UTC)
- **Comparison logic**: Mixes client and server timezone handling

### 2. Multiple Profile Creation Paths
- Direct insertion in signup page
- Database function `create_profile_for_new_user`
- Migration scripts
- Potential race conditions

### 3. Inconsistent Trial Status Checking
- Middleware uses client-side Date comparison
- Database function uses server-side NOW() comparison
- Different timezone contexts

## Solution Strategy

### Phase 1: Standardize Trial Calculation (High Priority)
1. **Use UTC consistently** for all trial calculations
2. **Standardize on database-level trial management**
3. **Remove client-side trial calculation**

### Phase 2: Fix Profile Creation (High Priority)
1. **Use single profile creation method**
2. **Ensure trial is always set correctly**
3. **Add validation and error handling**

### Phase 3: Improve Trial Status Checking (Medium Priority)
1. **Use database functions for status checking**
2. **Add proper timezone handling**
3. **Improve error handling and logging**

## Implementation Details

### 1. Update Signup Process
**File**: `src/app/signup/page.tsx`
- Remove client-side trial calculation
- Use database function `start_user_trial()` instead
- Add proper error handling

### 2. Update Trial Status Checking
**File**: `src/middleware.ts`
- Use database function `has_active_access()` for consistency
- Remove client-side Date comparisons
- Add proper error handling

### 3. Update Subscription Utilities
**File**: `src/lib/subscription.ts`
- Ensure all functions use UTC consistently
- Add timezone-aware comparison functions
- Improve error handling

### 4. Database Migration
**File**: `supabase/migrations/`
- Add function to fix existing trial data
- Ensure all users have proper trial end dates
- Add validation constraints

## Testing Strategy
1. **Unit tests** for trial calculation functions
2. **Integration tests** for signup flow
3. **Manual testing** with different timezones
4. **Database validation** of trial data

## Success Criteria
- [ ] All new users get proper 7-day trials
- [ ] Existing users with expired trials are fixed
- [ ] Trial status checking is consistent across all components
- [ ] No timezone-related trial expiration issues
- [ ] Proper error handling and logging

## Risk Mitigation
- **Backup existing trial data** before migration
- **Test in staging environment** first
- **Gradual rollout** with monitoring
- **Rollback plan** if issues arise 