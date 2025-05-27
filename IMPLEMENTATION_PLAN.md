## Implementation Plan: Add Subtle Hover Effect to 'Our Story' Card

**Objective:** Implement a subtle hover effect on the 'Our Story' card located on the landing page's "About" section.

**Affected Files:**

- `src/app/page.tsx`

**Steps:**

1.  **Identify the Target Element:**

    - The 'Our Story' card is located within the `V0AboutSection` component in `src/app/page.tsx`.
    - The specific `div` element for the card has a `ref` named `storyCardRef`.

2.  **Apply Hover Effect Classes:**
    - The following Tailwind CSS classes were added to the `div` element of the 'Our Story' card:
      - `hover:scale-105`: Slightly increases the size of the card on hover.
      - `hover:shadow-xl`: Adds a more pronounced shadow on hover for a lifting effect.
      - `transition-all`: Applies a transition to all animatable properties.
      - `duration-300`: Sets the transition duration to 300 milliseconds.
      - `ease-in-out`: Uses an ease-in-out timing function for the transition.
    - The class `hover-lift` was removed as its definition was not found.

**Assumptions:**

- Standard Tailwind CSS hover and transition utilities are available and configured correctly in the project.

**Potential Uncertainties:**

- None anticipated for this specific change.

## Implementation Plan: Add Subtle Radiating Rounded Rectangular Pulse Animation to 'Join Us' Button

**Objective:** Implement an even smaller, blue, rounded-rectangular pulse animation with a quicker pulse rate (1.5s cycle), that radiates outwards from the 'Join Us' button, matching its corner radius and extending beyond its bounds. The button itself should not pulse.

**Affected Files:**

- `src/app/page.tsx` (class `radiate-effect` remains, `relative` and `z-10` also remain)
- `src/styles/globals.css`

**Steps:**

1.  **`.radiate-effect` Class (No Change):**

    - The `.radiate-effect` class in `src/styles/globals.css` (with `position: relative;`) remains as is.

2.  **Fine-tune Radiating Pulse Animation and Styles in `globals.css`:**

    - The CSS keyframes `radiate-rect-pulse` in `src/styles/globals.css` remain with the reduced maximum scale (1.5x):
      ```css
      @keyframes radiate-rect-pulse {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.4; /* Start slightly visible */
        }
        100% {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0;
        }
      }
      ```
    - The `.radiate-effect::after` pseudo-element styles in `src/styles/globals.css` were updated to adjust the animation duration for even faster pulses:
      ```css
      .radiate-effect::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100%; /* Match button width */
        height: 100%; /* Match button height */
        background-color: rgba(59, 130, 246, 0.4); /* Tailwind blue-500 at 40% opacity */
        border-radius: var(--radius); /* Added to match button's rounded-lg */
        transform: translate(-50%, -50%) scale(1);
        opacity: 0; /* Initial state for animation start */
        animation: radiate-rect-pulse 1.5s ease-out infinite; /* Even faster duration from 2.0s */
        pointer-events: none;
        z-index: 0;
      }
      ```

3.  **Button Class Application (No Change to `page.tsx` classes):**

    - The `radiate-effect`, `relative`, and `z-10` classes on the 'Join Us' `Link` component in `src/app/page.tsx` remain unchanged and enable this refined CSS-driven effect.

4.  **Verify Implementation:**
    - Run the development server and visually inspect the 'Join Us' button. The pulse should be small, rounded-rectangular, blue, and radiate outwards with a 1.5-second cycle time.

**Assumptions:**

- The button's text will remain visible and on top of the pseudo-element.
- `var(--radius)` correctly reflects the `rounded-lg` style of the button.

**Potential Uncertainties:**

- This speed might be getting close to being too active, depending on the desired level of subtlety.

## Implementation Plan: Update Dashboard Mockup on Landing Page

## 1. Project Goal

Update the dashboard mockup on the landing page (`src/app/page.tsx`) to more accurately reflect a provided image of the actual dashboard. The new mockup should feature two main sections: "Today's Snapshot" and "Workout Trends".

## 2. Detailed Steps

### Step 2.1: Prepare Tailwind Configuration

1.  **File:** `tailwind.config.ts`
2.  **Action:** Add a custom `fontSize` for `text-xxs` if it doesn't already exist. This will be used for smaller text elements in the mockup.
    ```typescript
    // ...
    theme: {
      extend: {
        fontSize: {
          'xxs': '0.625rem', // 10px, adjust as needed
        },
        // ... other extensions
      },
    },
    // ...
    ```

### Step 2.2: Update `src/app/page.tsx`

1.  **Locate Mockup:** Find the existing dashboard mockup section within the `HomePage` component. It's inside the "Computer Screen" div structure. The relevant part for replacement is likely the `div` with class `bg-gray-100 h-[calc(100%-32px)] p-2 flex flex-col space-y-2 text-xs overflow-hidden` and its children.
2.  **Restructure Mockup Content Area:**
    - The existing main container for the mockup content (`<div className="bg-gray-100 h-[calc(100%-32px)] p-2 flex flex-col space-y-2 text-xs overflow-hidden">`) needs to be changed to allow for a sidebar and main content layout.
    - Modify it to: `<div className="bg-gray-100 h-[calc(100%-32px)] flex overflow-hidden">`. Padding and text sizes will be handled by child elements.
3.  **Implement Sidebar:**
    - As the first child of the container modified above, add the sidebar structure:
      ```tsx
      {
        /* Sidebar Start */
      }
      ;<div className="w-36 bg-white p-3 flex flex-col border-r border-gray-200">
        {/* User Profile Area */}
        <div className="flex flex-col items-center text-center mb-1">
          <div className="w-16 h-16 rounded-full bg-gray-300 mb-2 flex items-center justify-center text-gray-500 text-2xl">
            <span>🧑‍💻</span> {/* Placeholder Avatar */}
          </div>
          <p className="font-semibold text-gray-800 text-sm">Kyler</p>
          <p className="text-xxs text-gray-500">kzanuck@gmail.com</p>
        </div>
        {/* Divider */}
        <hr className="border-gray-200 my-2" />
        {/* Navigation Links */}
        <nav className="flex flex-col space-y-0.5 text-sm">
          {/* Home */}
          <div className="flex items-center space-x-2.5 py-1.5 px-2 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="text-slate-700">Home</span>
          </div>
          {/* Dashboard (Active) */}
          <div className="flex items-center space-x-2.5 py-1.5 px-2 rounded-md bg-slate-100 text-blue-700 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
            <span className="font-medium text-blue-700">Dashboard</span>
          </div>
          {/* Workouts */}
          <div className="flex items-center space-x-2.5 py-1.5 px-2 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <line x1="18" y1="18" x2="22" y2="18"></line>
              <line x1="2" y1="18" x2="6" y2="18"></line>
              <line x1="7" y1="18" x2="17" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="18"></line>
              <line x1="8" y1="6" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="12" y2="2"></line>
              <line x1="8" y1="6" x2="12" y2="2"></line>
            </svg>
            <span className="text-slate-700">Workouts</span>
          </div>
          {/* Profile */}
          <div className="flex items-center space-x-2.5 py-1.5 px-2 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="text-slate-700">Profile</span>
          </div>
          {/* Settings */}
          <div className="flex items-center space-x-2.5 py-1.5 px-2 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span className="text-slate-700">Settings</span>
          </div>
        </nav>
      </div>
      {
        /* Sidebar End */
      }
      ```
4.  **Wrap Existing Main Content:**
    - The previous content (Today's Snapshot and Workout Trends sections) will be wrapped in a new `div` that becomes the second child of the main flex container.
    - This wrapper: `<div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">`
5.  **Remove Old Mockup Content (if any remnants from before the two sections):** Ensure only the new sidebar and the main content wrapper (containing "Today's Snapshot" and "Workout Trends") are direct children of the `h-[calc(100%-32px)] flex` div.
6.  **Implement "Today's Snapshot" and "Workout Trends" Sections (as previously planned, now inside the main content wrapper):**
    - The structure for these two sections remains the same as defined in the previous version of this plan, but they will now reside inside the `<div className="flex-1 p-3 ...">`.

## 3. Assumptions & Uncertainties

- **`text-xxs` Definition:** Assumes `0.625rem` (10px) is an appropriate size. This can be adjusted.
- **Icon Implementation:** Updated to use simple SVG placeholders for sidebar icons. Snapshot card icon placeholders removed.
- **Chart Realism:** The chart will be a simplified visual representation, not a functional or pixel-perfect replica of a charting library's output.
- **Exact Styling:** Minor styling tweaks (paddings, margins, colors) might be needed after initial implementation to match the target image as closely as possible.
- **Responsiveness of Mockup:** The primary goal is to match the provided image. The internal responsiveness of this _mockup_ within the "computer screen" might be limited, as it's a static representation.

## 4. Future Considerations (Out of Scope for this task)

- Integrate `lucide-react` or another icon library for richer visuals.
- Make the mockup more responsive if it's intended to be shown on various screen sizes where the "computer screen" itself scales.
- Replace the static chart with a more dynamic-looking SVG or even a tiny, non-interactive charting component if hyper-realism is needed for the mockup.

## 5. Rollback Plan

- Revert changes to `src/app/page.tsx` and `tailwind.config.ts` using git.
- If `IMPLEMENTATION_PLAN.md` was created, it can be deleted or reverted.
