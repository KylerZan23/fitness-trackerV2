# ADR-038: Profile Activity Feed and Personal Records Enhancements

## Status
✅ **ACCEPTED** - Implemented

## Context
The profile page needed additional functionality to improve user control and data management:
- Users wanted the ability to collapse the Recent Activity section to save space
- Personal Records needed editing capabilities for users to update their achievements
- The system needed proper validation to ensure data integrity for personal records

## Decision

### Activity Feed Dropdown Toggle
- **Collapsible Interface**: Added show/hide toggle for Recent Activity section
- **Visual Indicators**: Activity count display and smooth CSS transitions
- **User Preference**: Configurable default expanded/collapsed state
- **Consistent Design**: Maintains profile page visual consistency

### Personal Records Editing System
- **Inline Editing**: Edit weight and reps directly within the PR cards
- **Full CRUD Operations**: Create, Read, Update, Delete personal records
- **Smart Validation**: E1RM calculation ensures only true personal records are saved
- **Exercise Management**: Support for main lifts (Squat, Bench Press, Deadlift, Overhead Press)
- **Unit Conversion**: Proper handling of kg/lbs weight unit preferences

### Data Architecture
- **Workout-Based Storage**: Personal records stored as workout entries, not separate records
- **E1RM Integration**: Uses existing strength calculation utilities for validation
- **Real-time Updates**: Automatic data refresh after record updates
- **Transaction Safety**: Proper error handling and rollback mechanisms

## Implementation Details

### Files Modified
- `src/components/profile/ActivityFeed.tsx` - Added dropdown toggle functionality
- `src/components/profile/PersonalRecordsSection.tsx` - Complete editing interface
- `src/app/_actions/profileActions.ts` - Added PR update/delete server actions
- `src/app/profile/page.tsx` - Added callback handlers for data refresh
- `README.md` - Updated feature documentation

### Activity Feed Features
- **Toggle Button**: Show/Hide with chevron icons
- **Smooth Animations**: CSS transitions for expand/collapse
- **Activity Count**: Display number of activities in header
- **Responsive Design**: Works on all screen sizes

### Personal Records Features
- **Edit Mode**: Click edit icon to enable inline editing
- **Add Records**: Plus icon for exercises without PRs
- **Delete Records**: Trash icon with confirmation dialog
- **Input Validation**: 
  - Weight: 0-1000kg (0-2200lbs)
  - Reps: 1-100
  - E1RM improvement validation
- **Unit Conversion**: Automatic kg/lbs conversion based on user preference

### Server Actions
- **`updatePersonalRecord()`**: 
  - Validates inputs and calculates E1RM
  - Ensures new record is actually a personal best
  - Inserts workout entry with proper exercise mapping
- **`deletePersonalRecord()`**:
  - Finds best workout for exercise
  - Safely removes record with proper error handling
- **Exercise Mapping**: Display names to database exercise names

### Validation Rules
- **Weight Validation**: Realistic ranges with unit-specific limits
- **Rep Validation**: 1-100 reps to prevent unrealistic entries
- **E1RM Verification**: New records must exceed current best E1RM
- **Exercise Validation**: Only allows main compound lifts

## Consequences

### Positive
- Users can now fully manage their personal records
- Activity feed can be collapsed to reduce visual clutter
- Data integrity maintained through E1RM validation
- Smooth, intuitive user experience with proper feedback
- Leverages existing workout data structure
- Real-time updates provide immediate feedback

### Technical Benefits
- No new database tables required
- Reuses existing E1RM calculation logic
- Maintains data consistency with workout history
- Proper error handling and user feedback

### Considerations
- Server load from PR validation calculations
- Need to maintain consistency between workout data and displayed PRs
- Delete operations are permanent (could add soft delete in future)

## Alternatives Considered

1. **Separate PR Table**: Would have created data consistency issues
2. **Always-Visible Activity**: Less flexible for users with long activity feeds
3. **Bulk PR Editing**: Too complex for the use case

## Testing Strategy

1. **Unit Tests**: Validation logic for E1RM calculations
2. **Integration Tests**: Server action functionality
3. **UI Tests**: Component state management and user interactions
4. **Edge Cases**: Invalid inputs, network errors, concurrent updates

## Future Enhancements

1. **PR History**: Track progression over time
2. **Achievement Badges**: Recognize milestone achievements
3. **Export Functionality**: Allow users to export their PR data
4. **Social Sharing**: Share PRs with community

## Related ADRs
- ADR-037: Profile Editing Enhancements
- ADR-032: Profile Backend Integration
- ADR-003: AI Program Generation Architecture (E1RM calculations)

## Confidence Score: 95%

This enhancement provides comprehensive personal records management while maintaining data integrity and delivering an excellent user experience. The activity feed dropdown adds practical utility without compromising the design. 