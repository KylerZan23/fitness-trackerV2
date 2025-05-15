# Dashboard UI Redesign Implementation Plan

**Goal:** Refactor the existing dashboard page (`src/app/dashboard/page.tsx`) to match the UI/UX design seen in the landing page mockup (**light theme**, sidebar navigation, card-based layout).

**Assumptions:**

*   The project uses Tailwind CSS and Shadcn/ui (based on component paths like `@/components/ui`).
*   The landing page mockup accurately represents the desired final state (light theme).
*   Existing data fetching logic (`fetchData`, db functions) is sufficient and doesn't need major changes for the new UI structure.
*   We will create reusable layout components.

**Steps:**

1.  **Create Layout Components:**
    *   **`Sidebar` Component (`src/components/layout/Sidebar.tsx`):**
        *   Create a fixed-position sidebar component.
        *   Style with a **light background (e.g., white or light gray)** according to the mockup.
        *   Include placeholder navigation links (e.g., Dashboard, Workouts, Nutrition, Profile/Settings). These can be implemented fully later.
        *   Potentially include the `UserAvatar` and user name/email at the top or bottom.
        *   Include the Logout button within the sidebar.
    *   **`DashboardLayout` Component (`src/components/layout/DashboardLayout.tsx`):**
        *   Create a layout component that arranges the `Sidebar` and the main content area.
        *   Use Flexbox or Grid to position the sidebar (fixed width) and the main content area (flexible width, takes remaining space).
        *   Set a **light background for the overall layout (e.g., `bg-gray-100`)**.
        *   Ensure proper padding and margins for the main content area.

2.  **Refactor `src/app/dashboard/page.tsx`:**
    *   Wrap the main return statement of the component with the new `DashboardLayout`.
    *   Move the rendering logic for the current dashboard content *inside* the main content area provided by `DashboardLayout`.
    *   Remove the existing logout button rendering if it's moved to the `Sidebar`.
    *   Adjust loading/error state styling for the **light theme**.

3.  **Style Existing Components (Light Theme):**
    *   **`StatsCard` (`src/components/dashboard/StatsCard.tsx`):** Ensure its styling matches the card design in the mockup (**light background, dark text, light borders/shadows**).
    *   **`WorkoutChart` (`src/components/dashboard/WorkoutChart.tsx`):** Ensure chart colors and container styling fit the **light theme**. (Container style set in DashboardPage).
    *   **`MuscleDistributionChart` (`src/components/workout/MuscleDistributionChart.tsx`):** Ensure chart colors and container styling fit the **light theme**. (Container style set in DashboardPage).
    *   **`RecentRun` (`src/components/dashboard/RecentRun.tsx`):** Style this component as a card consistent with `StatsCard` for the **light theme**. (Container style set in DashboardPage).

4.  **Arrange Content:**
    *   Use Tailwind CSS grid or flexbox within the main content area of `src/app/dashboard/page.tsx` to arrange the components in a grid or stacked layout similar to the mockup.

5.  **Testing:**
    *   Manually test the dashboard page in different viewport sizes to ensure responsiveness.
    *   Verify data still loads correctly.
    *   Check for console errors.

6.  **Documentation:**
    *   Update `README.md` to accurately describe the dashboard UI (**light theme**).
    *   Add comments to new layout components if necessary.

**Potential Challenges:**

*   Ensuring responsiveness of the sidebar and main content layout.
*   Perfectly matching the colors and spacing from the mockup image.
*   Ensuring all text and chart elements are visible on the light background.

**File Structure Changes:**

*   **New:** `src/components/layout/Sidebar.tsx`
*   **New:** `src/components/layout/DashboardLayout.tsx`
*   **Modified:** `src/app/dashboard/page.tsx`
*   **Modified:** `src/components/dashboard/StatsCard.tsx`
*   **Potentially Modified:** `src/components/dashboard/WorkoutChart.tsx`, `src/components/workout/MuscleDistributionChart.tsx`, `src/components/dashboard/RecentRun.tsx` (if internal styling needs light theme adjustments). 