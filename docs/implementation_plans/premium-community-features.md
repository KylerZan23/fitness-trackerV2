# Premium Community Features Implementation Plan

## Overview
Implement two premium community features to leverage the existing Pro tier subscription system:
1. **Verified Badges**: Display 'Pro' badge next to usernames for Pro tier subscribers
2. **Exclusive Content**: Create 'Expert Q&A' content type visible only to Pro subscribers

## Current State Analysis
- ✅ Pro tier subscription system already implemented
- ✅ Database schema supports `subscription_tier` with 'pro' value
- ✅ Helper functions `hasProAccess()` and `getSubscriptionTier()` exist
- ✅ Community posts system exists in `community_posts` table
- ❌ No content type classification in posts
- ❌ No Pro badge display in UI components

## Database Schema Changes

### 1. Add Content Type to Community Posts
```sql
-- Add content_type column to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'general' 
CHECK (content_type IN ('general', 'expert_qa'));

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_community_posts_content_type 
ON public.community_posts(content_type);

-- Update existing posts to have 'general' content type
UPDATE public.community_posts 
SET content_type = 'general' 
WHERE content_type IS NULL;

-- Add comments
COMMENT ON COLUMN public.community_posts.content_type IS 'Content type: general (public), expert_qa (Pro subscribers only)';
```

### 2. Update RLS Policies for Expert Q&A
```sql
-- Update RLS policy to restrict Expert Q&A content to Pro users
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON community_posts;

-- New policy: General posts viewable by everyone, Expert Q&A only for Pro users
CREATE POLICY "Content access based on subscription tier" ON community_posts
FOR SELECT USING (
  content_type = 'general' OR 
  (content_type = 'expert_qa' AND has_pro_access(auth.uid()))
);
```

## Frontend Implementation

### 1. Pro Badge Component
Create reusable Pro badge component:

**File**: `src/components/ui/ProBadge.tsx`
```tsx
interface ProBadgeProps {
  userId: string
  variant?: 'default' | 'compact'
}

export function ProBadge({ userId, variant = 'default' }: ProBadgeProps)
```

### 2. Enhanced User Display Components
Update components to show Pro badges:
- `src/components/community/PostCard.tsx`
- `src/components/community/WorkoutActivityCard.tsx`
- `src/components/community/CommentItem.tsx`
- `src/components/community/UserSearchCard.tsx`

### 3. Expert Q&A Content Management
**File**: `src/components/community/ExpertQAManager.tsx`
- Form for creating Expert Q&A posts (Pro users only)
- Filter for viewing Expert Q&A content
- Access control validation

### 4. Community Actions Enhancement
Update `src/app/_actions/communityActions.ts`:
- Add `createExpertQAPost()` action
- Add subscription tier checking to data fetching
- Add content type filtering

## Implementation Steps

### Phase 1: Database Schema (Immediate)
1. ✅ Run migration to add `content_type` column
2. ✅ Update RLS policies for access control
3. ✅ Test Expert Q&A access restrictions

### Phase 2: Pro Badge System (High Priority)
1. ✅ Create `ProBadge` component with subscription checking
2. ✅ Update all community components to display Pro badges
3. ✅ Add caching for subscription status to avoid repeated queries
4. ✅ Test badge display across different components

### Phase 3: Expert Q&A Content (High Priority)
1. ✅ Create Expert Q&A creation form
2. ✅ Add content type filtering in community views
3. ✅ Update server actions for Expert Q&A posts
4. ✅ Add Expert Q&A tab/filter in community interface

### Phase 4: UI/UX Polish (Medium Priority)
1. Add Expert Q&A specific styling and icons
2. Create onboarding tooltips for Pro features
3. Add upgrade prompts for non-Pro users viewing restricted content
4. Implement loading states and error handling

## Technical Considerations

### Performance
- Cache subscription status to avoid repeated database queries
- Use React.memo for Pro badge components
- Implement efficient RLS policies

### Security
- Server-side subscription validation for all Expert Q&A operations
- RLS policies prevent unauthorized access to Pro content
- Input validation for Expert Q&A content creation

### User Experience
- Clear visual distinction for Expert Q&A content
- Graceful handling when non-Pro users encounter restricted content
- Upgrade prompts integrated naturally into the flow

## Testing Requirements

### Unit Tests
- Pro badge component rendering
- Subscription status checking logic
- Expert Q&A access control

### Integration Tests
- End-to-end Expert Q&A creation and viewing
- Pro badge display across community features
- Access control enforcement

### Manual Testing
- Test with different subscription tiers
- Verify RLS policy enforcement
- Cross-browser compatibility for Pro badges

## Success Metrics
- Pro badges display correctly for all Pro users
- Expert Q&A content properly restricted to Pro users
- No performance degradation in community feeds
- Positive user feedback on premium feature visibility

## Future Enhancements
- Expert verification system for Q&A contributors
- Enhanced Expert Q&A features (categories, tags, expert profiles)
- Pro-only community groups
- Advanced moderation tools for Pro content