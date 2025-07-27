# ADR-037: Profile Editing Enhancements

## Status
✅ **ACCEPTED** - Implemented

## Context
The profile page needed editing functionality to allow users to:
- Change their profile picture
- Update personal information (age, height, weight)
- Remove hardcoded text that didn't reflect actual data
- Provide a more dynamic and user-controlled experience

## Decision

### Profile Picture Editing
- **Integration Method**: Leveraged existing `ProfilePictureUpload` component
- **UX Pattern**: Hover overlay with edit icon on profile picture
- **Modal Interface**: Separate modal for upload workflow to maintain clean design
- **Real-time Updates**: Immediate preview and profile data refresh after upload

### Editable Profile Fields
- **Inline Editing**: Edit/save/cancel pattern for age, height, weight fields
- **Unit Support**: Respect user's weight_unit preference (kg/lbs)
- **Height Handling**: 
  - Metric users: single input for centimeters
  - Imperial users: separate inputs for feet and inches
- **Validation**: Client and server-side validation with appropriate ranges

### UI/UX Improvements
- **Removed Hardcoded Text**:
  - "5+ Years" → "2+ Years" for Advanced experience level
  - "Prime Age" badge completely removed from age statistics
- **Clean Interface**: Edit icons, save/cancel buttons, error messaging

### Server Actions
- **New Functions**:
  - `updateProfileBasicInfo()`: Handles age, height, weight updates
  - `updateProfilePicture()`: Manages profile picture URL updates
- **Validation**: Comprehensive input validation and error handling
- **Type Safety**: Full TypeScript support with proper return types

## Implementation Details

### Files Modified
- `src/app/_actions/profileActions.ts` - Added update functions
- `src/components/profile/SocialProfileHeader.tsx` - Added profile picture editing
- `src/components/profile/AgeStatsCard.tsx` - Made fields editable, removed hardcoded text
- `src/components/profile/ExperienceCard.tsx` - Removed hardcoded duration text
- `src/app/profile/page.tsx` - Added profile update callbacks
- `README.md` - Updated documentation

### Validation Rules
- **Age**: 13-120 years
- **Height**: 100-250cm (3-8 feet + 0-11 inches)
- **Weight**: 30-300kg (66-660 lbs equivalent)

### Error Handling
- Client-side validation with immediate feedback
- Server-side validation with detailed error messages
- Graceful fallbacks for network issues
- Loading states during save operations

## Consequences

### Positive
- Users can now fully customize their profile information
- Real-time updates provide immediate feedback
- Proper validation prevents invalid data entry
- Clean, intuitive editing interface
- Maintains existing design aesthetic
- Leverages existing infrastructure (ProfilePictureUpload component)

### Considerations
- Additional server load from profile update operations
- Need to maintain data consistency across profile updates
- Client-side state management for editing modes

## Alternatives Considered

1. **Separate Edit Page**: Would have disrupted user flow
2. **Always-Editable Fields**: Would have cluttered the interface
3. **Bulk Edit Form**: Less intuitive than inline editing

## Related ADRs
- ADR-032: Profile Backend Integration
- ADR-017: Onboarding Profile Creation Fix

## Confidence Score: 95%

This enhancement significantly improves user control over their profile while maintaining a clean, professional interface. 