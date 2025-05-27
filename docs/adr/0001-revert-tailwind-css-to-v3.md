# ADR 0001: Revert Tailwind CSS to v3 from v4 Alpha

**Date**: {{TODAY_DATE}}

**Status**: Accepted

## Context

The project was experiencing issues with HTML rendering ("broken HTML"), likely due to a mismatch in Tailwind CSS versions and configurations.

- **Dependencies (`package.json`)**: Listed `tailwindcss: ^4.1.7` (v4 Alpha) and `@tailwindcss/postcss: ^4.1.7` (v4 Alpha PostCSS plugin).
- **Configuration (`tailwind.config.ts`, `postcss.config.js`)**: Files were structured according to Tailwind CSS v3 conventions.
- **Shadcn UI**: The project uses Shadcn UI, which is typically integrated with Tailwind CSS v3.
- **Pre-release Software**: The project also utilized other pre-release or very recent major versions (Next.js ^15.2.0, React ^19.0.0), increasing instability risks.

Tailwind CSS v4 Alpha represents a significant rewrite with different configuration paradigms. Using v3 configuration files with v4 dependencies leads to incorrect processing of Tailwind classes.

## Decision

To ensure stability, compatibility with Shadcn UI, and correct styling application, the decision was made to revert Tailwind CSS from v4 Alpha to a stable v3 version (`^3.4.3`).

This involved:

1.  **Modifying `package.json`**:
    - Changed `tailwindcss` dependency from `^4.1.7` to `^3.4.3`.
    - Removed `@tailwindcss/postcss` from `devDependencies`.
    - Ensured `autoprefixer` (`^10.4.14`) and `postcss` (`^8.4.24`) versions compatible with Tailwind CSS v3 were present.
2.  **Updating `postcss.config.js`**:
    - Changed plugins from `{'@tailwindcss/postcss': {}}` to `tailwindcss: {}` and `autoprefixer: {}`.
3.  **Correcting `tailwind.config.ts`**:
    - Updated the `content` array to correctly point to source files within the `src` directory (e.g., `./src/app/**/*.{js,ts,jsx,tsx,mdx}`, `./src/components/**/*.{js,ts,jsx,tsx,mdx}`).
    - Corrected keyframe animation values from `height: 0` to `height: "0"`.
    - Changed `darkMode: ["class"]` to `darkMode: "class"`.

## Consequences

**Positive**:

- Improved stability of the styling system.
- Correct application of Tailwind CSS classes, resolving the "broken HTML" issue.
- Better compatibility with the existing Shadcn UI components.
- Adherence to documented and stable configuration practices for Tailwind CSS v3.

**Negative**:

- The project will not leverage features or changes introduced in Tailwind CSS v4 Alpha at this time. This is an acceptable trade-off for stability.

**Considerations**:

- The versions of Next.js and React are still pre-release/very new. Downgrading these to more established stable versions (e.g., Next.js 14.x, React 18.x) is recommended for further stability if issues persist or as a general best practice.

## Next Steps (Manual by User)

- Delete `node_modules` directory.
- Delete `yarn.lock` (or `package-lock.json`).
- Run `yarn install` (or `npm install`).
- Delete the `.next` directory.
- Restart the development server (`yarn dev`).
