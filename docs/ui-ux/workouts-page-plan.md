# Plan: Historical Workouts Page (`/workouts`)

**Goal:** Create a new page at `/workouts` displaying a historical log of all user workouts, grouped by month, visually modeled after the provided image example (yearly calendar grid).

**Reference:** 
- Provided image example (12-month grid with activity indicators).
- Existing `/dashboard` page for layout and styling consistency (light theme).

**Target File:** `src/app/workouts/page.tsx` (New file)

**Supporting Files:**
- `src/lib/db.ts`: Needs a function to fetch all workouts for a user.
- `src/components/workouts/MonthLogCard.tsx`: (Potentially) A new component for rendering each month's block.

---

## Data Requirements

1.  **Fetch All Workouts:** Create a function `getAllWorkouts()` in `src/lib/db.ts` that retrieves all `workouts` table entries for the currently authenticated user, ordered by `created_at` ascending. Each workout should include at least `id`, `created_at`, and `duration`.
    *   *Consideration:* For performance with many workouts, this might later need pagination or server-side aggregation, but start with fetching all.
2.  **Workout Grouping:** The client-side component (`src/app/workouts/page.tsx`) will process the fetched workouts and group them by year and month.

---

## UI Structure & Components

1.  **Page Layout:**
    *   Use `DashboardLayout` as the main wrapper.
    *   The main content area will contain a title (e.g., "Workout History - {Current Year}") and the 12-month grid.
2.  **Month Grid:**
    *   A `div` using CSS Grid (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`) to display the 12 months.
3.  **Month Card (`MonthLogCard.tsx` - Proposed):**
    *   A reusable component to render each month's block.
    *   **Props:** `monthName` (string), `year` (number), `workouts` (array of workouts for that month), `totalDurationHours` (number).
    *   **Styling:** Simple card/box style similar to the image (`bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative`). Add hover/focus states.
    *   **Content:**
        *   Month Name (e.g., "JAN") positioned top-right.
        *   Total Duration (e.g., "2 HOURS") positioned top-left.
        *   **Activity Indicators:** A container area where visual indicators (vertical bars) are rendered based on the `workouts` prop.
            *   Each bar represents a workout.
            *   Horizontal position: Determined by `getDay()` (0-30) from the workout's `created_at` date, scaled to the container width.
            *   Vertical height: Determined by the workout's `duration`, scaled relative to the maximum duration in the dataset or a fixed reasonable max.
            *   Styling: Simple black bars (`bg-gray-900`).
    *   **Interactivity (Optional):** Clicking a month card could potentially navigate to a detailed view for that month (future enhancement).

---

## Implementation Steps

1.  **Data Fetching Function:**
    *   Add `getAllWorkouts` function to `src/lib/db.ts` to fetch all `workouts` (id, created_at, duration) for the user, ordered by date.
2.  **Create Page Component:**
    *   Create `src/app/workouts/page.tsx`.
    *   Use `'use client'`. Import necessary hooks (`useState`, `useEffect`), layout (`DashboardLayout`), UI components (`Button`, etc. if needed), and the new data function (`getAllWorkouts`).
    *   Implement `useEffect` to fetch all workouts using `getAllWorkouts` on component mount.
    *   Add state for loading, error, and fetched workouts.
    *   Add logic to process fetched workouts: group them into a structure like `{[year]: {[month]: {workouts: [], totalDuration: 0}}}`.
3.  **Create Month Card Component (Optional but Recommended):**
    *   Create `src/components/workouts/MonthLogCard.tsx`.
    *   Implement the component as described in "UI Structure & Components". Pay attention to scaling logic for bar height/position.
4.  **Render the Grid:**
    *   In `src/app/workouts/page.tsx`, get the data for the current year (or a selectable year).
    *   Iterate through months 1-12.
    *   For each month, render the `MonthLogCard` component, passing the relevant name, year, workouts for that month, and calculated total duration in hours.
    *   Handle months with no data (render an empty card).
    *   Add loading and error states to the page component.
5.  **Styling:** Apply Tailwind classes to achieve the visual style of the reference image and ensure consistency with the light theme.
6.  **Testing:** Manually test loading, error states, data display, grouping logic, and visual appearance.

---

## Open Questions / Future Enhancements

-   How to handle multiple years of data? (Initial version might just show the current year, add year selector later).
-   Exact scaling logic for activity indicator height and position.
-   Performance optimizations for large datasets.
-   Interactivity (clicking a month).
-   Displaying Workout Groups vs Individual Workouts (current plan focuses on individual `workouts` table entries). 