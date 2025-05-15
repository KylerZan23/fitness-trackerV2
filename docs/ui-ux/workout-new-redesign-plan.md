# Plan: Redesign /workout/new Page UI/UX

**Goal:** Update the UI/UX of the `/workout/new` page to be consistent with the design of the `/dashboard` page.

**Reference:** `/dashboard` page layout, components, and styling.

**Target File:** `src/app/workout/new/page.tsx` (Assuming this is the primary file)

---

## Analysis of Current State (`/workout/new`)

*(Filled in based on `src/app/workout/new/page.tsx`)*

-   **Layout:** Basic full-page form, lacking the standard application layout (no sidebar/consistent header).
-   **Components:** Standard HTML form elements (`input`, `textarea`, `button`), `MuscleGroupSelector`, `ExerciseSelector` (needs review/removal based on README), uses `useState` for form logic, `sonner` for toasts.
-   **Styling:** Basic Tailwind, not integrated with a dashboard theme. Inconsistent visual appearance compared to the dashboard.
-   **Structure:** Single large component handling state, UI, and logic for both single and group workout modes.

## Analysis of Target State (`/dashboard`)

*(Filled in based on `src/app/dashboard/page.tsx`)*

-   **Layout:** Uses `DashboardLayout` component (`@/components/layout/DashboardLayout`), providing a consistent structure (likely sidebar + main content).
-   **Components:** Leverages specific, styled components (`StatsCard`, `WorkoutChart`, `MuscleDistributionChart`, `RecentRun`, `GoalsCard`, `Error`). Suggests a reusable UI component library.
-   **Styling:** Consistent theme (likely defined in `DashboardLayout` and shared components) using Tailwind CSS. Visually coherent.
-   **Structure:** Main page component orchestrates data fetching and passes props to specialized display components. Clear separation of concerns.

---

## Proposed Changes

1.  **Layout:**
    *   Integrate the standard dashboard layout (e.g., wrap the page content in the `DashboardLayout` component if one exists, or replicate its structure with sidebar and main content area).
    *   Ensure consistent header/navigation elements if present on the dashboard.

2.  **Form Styling:**
    *   Restyle all form elements (`input`, `label`, `select`, `button`) to match the appearance of those on the dashboard.
    *   Use consistent spacing, borders, background colors, and focus states.
    *   Leverage existing styled form components if available.

3.  **Component Replacement/Styling:**
    *   Replace generic HTML elements with styled components used on the dashboard where appropriate (e.g., use `Card` components for sections if the dashboard uses them).
    *   Ensure buttons match the dashboard's button styles (size, color, hover effects).

4.  **Typography & Color Palette:**
    *   Apply the same font families, sizes, and weights used on the dashboard.
    *   Use the established color palette for backgrounds, text, borders, and interactive elements. Ensure consistency with the dashboard's theme (light or dark).

5.  **Responsiveness:**
    *   Ensure the redesigned page is responsive and adapts well to different screen sizes, consistent with the dashboard's responsiveness.

---

## Implementation Steps

1.  **Analyze Dashboard Layout & Components:** Read the code for `src/components/layout/DashboardLayout.tsx` and components like `Card`, `Button`, form elements used within the dashboard (`src/components/dashboard/*`, `src/components/ui/*`). Confirm the active theme (light/dark) and identify reusable styling patterns/components.
2.  **Analyze Workout/New:** Review `src/app/workout/new/page.tsx` again, focusing on the form structure and state logic. Confirm if `ExerciseSelector` should be removed.
3.  **Refactor Layout:** Modify `src/app/workout/new/page.tsx` to import and use `DashboardLayout` as the top-level wrapper.
4.  **Refactor Form Structure:** Break down the large form into smaller, manageable components if feasible. Consider using `Card`-like components (if available) to group sections (e.g., "Workout Details", "Add Exercise", "Exercise List").
5.  **Restyle Components:** Replace standard HTML form elements with themed components from the UI library (e.g., styled `Input`, `Button` components) or apply consistent Tailwind classes used in the dashboard/UI library. Ensure `sonner` toasts match the theme.
6.  **State Management (Optional Refactor):** Consider if form state logic (`useState` hooks) can be simplified, potentially using `react-hook-form` if it's used elsewhere and appropriate. (Check project dependencies).
7.  **Testing:** Manually test the redesigned page for visual consistency with the dashboard, ensure all form functionality (single/group mode, adding/removing exercises, submission) works correctly, and verify responsiveness.
8.  **Documentation:** Update `README.md` briefly mentioning the UI overhaul of the workout logging page. Remove conflicting information about `ExerciseSelector` if it's removed.

---

## Open Questions/Verification

-   Confirm the current active theme (light/dark) of the `/dashboard` page.
-   Identify the exact file path for the dashboard page (`src/app/dashboard/page.tsx`?) and any shared layout components.
-   Identify the exact file path for the workout creation page (`src/app/workout/new/page.tsx`?). 