# Dashboard UI Update Implementation Plan

**Goal:** Refactor the `src/app/dashboard/page.tsx` to improve its organization and display of information as per user request.

**Tasks:**

1.  **Modify Welcome Banner:**

    - Locate the existing welcome message section (currently conditional on `showWelcome`).
    - Change the title to "Welcome back, {profile.name}!".
    - Update the background gradient to match the landing page (e.g., `from-indigo-600 via-purple-600 to-rose-500`).
    - Remove the sub-text "Ready to track your progress?".
    - Remove the dismiss button for the welcome message.
    - Remove the "Quick Links" section (Log Workout, Log Run, Set Goals buttons) from the banner.
    - Make the banner always visible, removing the `showWelcome` state and associated logic if it's no longer needed, or ensure it's always true.

2.  **Update "Today's Snapshot" Section:**

    - Locate the section currently titled "Today so far (...)".
    - Change the title to "Today's Snapshot".
    - Ensure the displayed statistics are:
      - "Exercises": Will use `todayStats.totalWorkouts`. The card title will be "Exercises".
      - "Sets": Will use `todayStats.totalSets`. The card title will be "Sets".
      - "Duration": Will use `todayStats.totalDuration` (fallback to 0). The card title will be "Duration", displaying total minutes.
      - "Total Weight": Will use `todayStats.totalWeight`. The card title will be "Total Weight".
    - Update `StatsCard` props accordingly for titles.

3.  **Remove "Overall Stats" Section:**

    - Locate the JSX block rendering the "Overall Stats" summary.
    - Delete this entire section.

4.  **Reorder Sections:**

    - Move the "Workout Trends" chart section to be rendered directly below the "Today's Snapshot" section.

5.  **Refactor AI Personal Coach Display to Popup:**

    - Add state variable `isCoachPopupOpen` (default `false`) and `toggleCoachPopup` function in `src/app/dashboard/page.tsx`.
    - Remove the `AICoachCard` from its static position in the dashboard grid.
    - Add a Floating Action Button (FAB) fixed to the bottom-right of the page. This button will use an SVG icon and call `toggleCoachPopup` on click.
    - Conditionally render a popup container based on `isCoachPopupOpen`.
    - The popup will be fixed position (e.g., bottom-right, above FAB), styled as a card, and contain:
      - A header with the title "AI Personal Coach".
      - A close button ('X') that sets `isCoachPopupOpen` to `false`.
      - The `AICoachCard` component within a scrollable content area.
    - Apply `animate-fadeInUp` class for popup entry animation (user to ensure Tailwind definition).
    - **Refactor `AICoachCard.tsx`:**
      - Remove its outermost card-like styling (e.g., `bg-white`, `p-4`, `rounded-lg`, `shadow-sm`, `border`). The popup shell in `dashboard/page.tsx` now provides this.
      - Remove the `h2` title "AI Personal Coach" from within `AICoachCard.tsx` as this is now handled by the popup shell.
      - Reposition the "Get New Advice" button to be a primary action within the content area of `AICoachCard.tsx` (e.g., at the bottom, full-width).
      - Ensure `AICoachCard.tsx` primarily renders its internal content (loading/error states, recommendations) to fit within the new popup structure.

6.  **Improve "Your Recent Run" Card Display:**
    - Review `src/components/dashboard/RecentRun.tsx`.
    - Ensure the main container for the component, especially in its success state (when a run is displayed), has proper card styling consistent with the dashboard's light theme (e.g., `bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6`).
    - The title "Your Recent Run" should be part of this card.
    - Update loading, error, and "no run" states within `RecentRun.tsx` to also use the same consistent light-theme card styling.
    - Adjust styling within `src/components/run/RunCard.tsx` (e.g., change `text-white/60` to `text-gray-500`) to ensure run details, including the date, are clearly visible when `RunCard` is displayed on a light-themed background provided by `RecentRun.tsx`.

**File to be Modified:**

- `src/app/dashboard/page.tsx`

**Assumptions:**

- `profile.name` correctly holds the user's name for the welcome banner.
- `todayStats.totalWorkouts` is an acceptable representation for "Exercises" in the snapshot.
- `todayStats.totalSets`, `todayStats.totalDuration`, and `todayStats.totalWeight` are the correct data points for "Sets", "Total Duration", and "Total Weight" respectively.
- The existing `StatsCard` component can be reused with updated titles.
- The `animate-fadeInUp` Tailwind CSS class is available or will be defined by the user.

**Potential Side Effects:**

- Removing `showWelcome` state might affect other parts of the component if it was used elsewhere, but a quick scan suggests it's only for the banner. This will be double-checked during implementation.
- Changes to `StatsCard` titles are straightforward and unlikely to cause issues.
- Removing a JSX block is a direct modification and should not have unintended side effects if done carefully.
- The new FAB and popup rely on fixed positioning and z-index values; these should be checked against other fixed/absolute elements to ensure correct layering.

**Follow-up:**

- Review the `README.md` and update if necessary to reflect dashboard changes. (User request)
- Consider if an ADR is needed. Given these are UI tweaks within an existing page and not major architectural changes, new dependencies, or schema changes, an ADR is likely not required for _this specific set_ of changes. If the "AI Personal Coach" implementation involved more significant changes, that might have warranted an ADR.
