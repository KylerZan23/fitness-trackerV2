# UI/UX Design Plans Archive

This document consolidates all UI/UX design plans and specifications that were previously located in the `/docs/ui-ux` directory.

## Historical Workouts Page Plan

**Goal**: Create a new page at `/workouts` displaying a historical log of all user workouts, grouped by month, visually modeled after a yearly calendar grid.

### Data Requirements
- **Fetch All Workouts**: Create `getAllWorkouts()` function in `src/lib/db.ts`
- **Workout Grouping**: Client-side processing to group workouts by year and month
- **Performance Consideration**: May need pagination for large datasets

### UI Structure & Components

**Page Layout**:
- Use `DashboardLayout` as main wrapper
- Main content with title "Workout History - {Current Year}"
- 12-month grid layout

**Month Grid**:
- CSS Grid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
- Responsive design for different screen sizes

**Month Card Component** (`MonthLogCard.tsx`):
- **Props**: `monthName`, `year`, `workouts`, `totalDurationHours`
- **Styling**: Card with `bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative`
- **Content**:
  - Month Name (top-right position)
  - Total Duration (top-left position)
  - Activity Indicators: Vertical bars representing workouts
    - Horizontal position: Based on day of month (0-30)
    - Vertical height: Based on workout duration
    - Styling: Black bars (`bg-gray-900`)

### Implementation Steps
1. Add `getAllWorkouts` function to `src/lib/db.ts`
2. Create `src/app/workouts/page.tsx` with client-side component
3. Create `src/components/workouts/MonthLogCard.tsx` component
4. Implement workout grouping logic by year/month
5. Render 12-month grid with proper loading/error states
6. Apply consistent Tailwind styling with light theme

### Future Enhancements
- Multi-year data handling with year selector
- Activity indicator scaling logic refinement
- Performance optimizations for large datasets
- Month card interactivity (navigation to detailed views)
- Workout Groups vs Individual Workouts display options

## Workout New Page Redesign Plan

**Goal**: Update the UI/UX of the `/workout/new` page to be consistent with the design of the `/dashboard` page.

### Current State Analysis
- **Layout**: Basic full-page form lacking standard application layout
- **Components**: Standard HTML form elements, `MuscleGroupSelector`, `ExerciseSelector`
- **Styling**: Basic Tailwind, not integrated with dashboard theme
- **Structure**: Single large component handling all state, UI, and logic

### Target State (Dashboard Consistency)
- **Layout**: Uses `DashboardLayout` component with sidebar + main content
- **Components**: Leverages styled components (`StatsCard`, `WorkoutChart`, etc.)
- **Styling**: Consistent theme using shared Tailwind classes
- **Structure**: Clear separation of concerns with specialized display components

### Proposed Changes

**1. Layout Integration**:
- Wrap page content in `DashboardLayout` component
- Ensure consistent header/navigation elements
- Maintain sidebar functionality

**2. Form Styling**:
- Restyle all form elements to match dashboard appearance
- Use consistent spacing, borders, background colors, focus states
- Leverage existing styled form components

**3. Component Replacement**:
- Replace generic HTML elements with dashboard-styled components
- Use `Card` components for form sections if available
- Ensure buttons match dashboard button styles

**4. Typography & Color Palette**:
- Apply same font families, sizes, and weights as dashboard
- Use established color palette for all elements
- Maintain theme consistency (light/dark)

**5. Responsiveness**:
- Ensure page adapts to different screen sizes
- Maintain consistency with dashboard responsiveness

### Implementation Steps
1. **Analysis Phase**:
   - Review `src/components/layout/DashboardLayout.tsx`
   - Identify reusable UI components (`Card`, `Button`, form elements)
   - Confirm active theme and styling patterns

2. **Refactor Phase**:
   - Modify `src/app/workout/new/page.tsx` to use `DashboardLayout`
   - Break large form into smaller, manageable components
   - Group sections using `Card`-like components

3. **Styling Phase**:
   - Replace HTML form elements with themed components
   - Apply consistent Tailwind classes from dashboard
   - Ensure toast notifications match theme

4. **Testing Phase**:
   - Verify visual consistency with dashboard
   - Test all form functionality (single/group mode, exercises, submission)
   - Validate responsiveness across screen sizes

### Technical Considerations
- **State Management**: Consider `react-hook-form` if used elsewhere
- **Component Architecture**: Maintain separation between UI and business logic
- **Performance**: Ensure form interactions remain smooth and responsive
- **Accessibility**: Maintain proper form labels and keyboard navigation

### Open Questions
- Current active theme confirmation (light/dark)
- Exact file paths for dashboard and workout creation pages
- Available UI component library scope
- `ExerciseSelector` component removal requirements

## Design System Consistency

### Common Patterns
Both plans emphasize:
- **Layout Consistency**: Using `DashboardLayout` as standard wrapper
- **Component Reusability**: Leveraging existing styled components
- **Theme Adherence**: Maintaining visual consistency across pages
- **Responsive Design**: Ensuring mobile-first approach
- **Performance Considerations**: Optimizing for user experience

### Styling Guidelines
- **Cards**: `bg-white border border-gray-200 rounded-lg shadow-sm`
- **Grid Layouts**: Responsive CSS Grid with proper gap spacing
- **Interactive Elements**: Consistent hover and focus states
- **Typography**: Unified font hierarchy and sizing
- **Color Palette**: Established theme colors for consistency

### Best Practices
1. **Mobile-First Design**: Start with mobile layout, enhance for larger screens
2. **Component Isolation**: Create reusable components for common patterns
3. **State Management**: Keep UI state separate from business logic
4. **Performance**: Optimize for loading states and smooth interactions
5. **Accessibility**: Ensure proper ARIA labels and keyboard navigation

## Archive Purpose

These UI/UX plans have been consolidated for historical reference and to maintain consistency in future development. They represent the design thinking and implementation strategies used in the application's evolution.

For current UI/UX development, refer to:
- Active components in `/src/components`
- Current design system in `/src/styles`
- Live implementation patterns in existing pages 