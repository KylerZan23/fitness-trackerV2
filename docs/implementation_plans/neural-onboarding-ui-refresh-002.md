## Neural Onboarding UI Refresh (Pass 2)

### Goal
Elevate the `/neural/onboarding` experience to match the premium Neural branding used in `NeuralProgramDisplay` and the landing `HeroSection`: clean gradients, subtle glassmorphism, refined typography, and delightful micro-interactions without changing business logic.

### Scope
- Page header polish: Neural badge + Brain icon, gradient title, supportive subtitle, decorative gradient orbs.
- Progress indicator: glass track, gradient fill, refined step circles, improved percentages and copy.
- Question cards: elevated glass cards, gradient ring when selected/valid, hover lift, responsive grid for primary focus and similar options, better error/valid states.
- Navigation controls: consistent button styles, subtle transitions, disabled states.
- Non-functional: Keep data flow, validation, and API calls unchanged.

### Design Notes
- Color language: blue → purple gradients for Neural identity; keep primary CTA color from Tailwind config for global consistency.
- Components leverage existing shadcn primitives (`Card`, `Button`) where appropriate; otherwise Tailwind utility classes.
- Animations: prefer `animate-fade-in-up` and transition utilities for performance.

### Files Updated
- `src/app/neural/onboarding/page.tsx` — Header aesthetics, container visuals, background decor.
- `src/components/onboarding/NeuralProgressIndicator.tsx` — Glass track, gradient polish, step circle states.
- `src/components/onboarding/NeuralQuestionCard.tsx` — Card visuals, option states, grid layout polish, inputs.

### Risks
- Visual regressions on very small screens; mitigated with responsive classes and tested grid breakpoints.
- Increased DOM complexity; mitigated by minimal wrappers and no external deps.

### Test Plan
- Navigate to `/neural/onboarding` on mobile and desktop.
- Verify: header visuals, progress bar fill/steps, option cards hover/selected states, error/valid rings, keyboard focus outlines, and disabled states during submit.
- Confirm no changes to step logic, persistence, or API calls.


