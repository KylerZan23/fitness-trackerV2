## Implementation Plan: Add About Section to Landing Page

**Objective:** Add a scrollable "About" section below the existing hero/main content on the landing page (`src/app/page.tsx`).

**Affected Files:**

- `src/app/page.tsx`

**Steps:**

1.  **Create a New `AboutSection` Component:**

    - Define a new functional component named `AboutSection` within `src/app/page.tsx` (or in a separate file if it becomes complex, e.g., `src/components/landing/AboutSection.tsx`, but for now, inline is fine).
    - This component will return JSX for the "About" section.

2.  **Structure and Content for `AboutSection`:**

    - The section should have a main container `div`.
    - Include a heading, e.g., `<h2>About FitnessTracker V2</h2>`.
    - Add a few paragraphs of placeholder text describing the application. We can use some information from the `README.md` for inspiration.
      - "FitnessTracker V2 is a modern fitness tracking application built with Next.js, Supabase, and Tailwind CSS."
      - "Our mission is to provide a seamless and intuitive platform for users to log their workouts, track their running activities (including Strava integration), and monitor their progress towards their fitness goals."
      - "Key features include comprehensive workout logging, detailed run analysis with map visualization, user profile management, and a dashboard overview of your fitness journey."
    - Consider adding a call to action or a link back to the "Get Started" button if the user is not authenticated.

3.  **Styling for `AboutSection`:**

    - The section should be visually distinct from the hero section above it.
    - Use Tailwind CSS for styling.
    - Apply padding (e.g., `py-16` or `py-20`) to give it space.
    - Consider a background color. Since the main landing page has a gradient, perhaps a solid color that complements it, or a slightly different shade. For now, let's try a light gray or white background to make the text easily readable, similar to the dashboard's light theme mentioned in the README. E.g., `bg-gray-100 text-gray-800` or `bg-white text-gray-700`.
    - Ensure content is centered and has a maximum width, similar to other sections (e.g., `container mx-auto px-4`).

4.  **Integrate `AboutSection` into `HomePage`:**

    - In `src/app/page.tsx`, locate the end of the "Main Content" `div`. This is the `div` with class `container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`.
    - Place the `<AboutSection />` component immediately after this `div`, but _before_ the closing `</div>` of the main page container (`<div className="min-h-screen bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 text-white overflow-hidden">`).

5.  **Ensure Scrollability:**

    - The main `div` of the `HomePage` component has `min-h-screen` and `overflow-hidden`. Adding content below the current "Main Content" should naturally make the page scrollable if the total content height exceeds the viewport height. The `overflow-hidden` on the parent might be an issue if we want the _entire page_ to scroll. We might need to adjust this if the gradient background isn't meant to extend to the About section.
    - For now, let's assume the About section is part of the same scrollable area. If the gradient is an issue, we can wrap the hero and about sections in separate containers.
    - **Correction:** The `overflow-hidden` on the main `div` should be removed or changed to `overflow-y-auto` (or similar) to allow scrolling if the content exceeds the screen height. Or, better yet, ensure the `min-h-screen` allows content to push the page down. The current structure implies the gradient _should_ cover the whole scrollable area.

6.  **Testing:**
    - View the landing page in a browser.
    - Confirm the "About" section appears below the main content.
    - Confirm the page scrolls correctly to view the "About" section.
    - Check responsiveness on different screen sizes.

**Initial Content for About Section:**

```tsx
const AboutSection = () => {
  return (
    <section className="bg-white text-gray-800 py-20">
      {' '}
      {/* Or bg-gray-100 */}
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">About FitnessTracker V2</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-lg leading-relaxed">
            FitnessTracker V2 is a modern fitness tracking application built with Next.js, Supabase,
            and Tailwind CSS. Our goal is to empower you on your fitness journey by providing
            intuitive tools to monitor your progress and stay motivated.
          </p>
          <p className="text-lg leading-relaxed">
            Whether you're lifting weights, hitting the pavement for a run, or just trying to stay
            active, FitnessTracker V2 offers a comprehensive suite of features. Log detailed
            workouts, connect your Strava account to seamlessly import your runs, visualize your
            activity on interactive maps, and gain insights from your performance data.
          </p>
          <p className="text-lg leading-relaxed">
            We believe that tracking your fitness shouldn't be a chore. That's why we've focused on
            creating a clean, user-friendly interface that works beautifully on all your devices.
            Join us and unlock your potential!
          </p>
        </div>
      </div>
    </section>
  )
}
```
