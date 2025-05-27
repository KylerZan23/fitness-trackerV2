# Implementation Plan: Revert to Tailwind CSS v3

This document outlines the steps to revert the project from Tailwind CSS v4 alpha to Tailwind CSS v3. This change is motivated by stability concerns, compatibility with Shadcn UI, and incorrect configuration for the currently installed v4 alpha version.

## 1. Update `package.json`

The following dependencies will be modified:

- **`tailwindcss`**: Change from `^4.1.7` to `^3.4.3`.
- **`@tailwindcss/postcss`**: This package will be removed from `devDependencies` as it's specific to Tailwind CSS v4 and not typically required for v3 when `tailwindcss` is correctly configured in `postcss.config.js`.
- **`autoprefixer`**: Ensure `^10.4.14` (or latest v10.x) is present. (Already correct)
- **`postcss`**: Ensure `^8.4.24` (or latest v8.x) is present. (Already correct)

**Action:**
Modify `dependencies` and `devDependencies` in `package.json`.

## 2. Update `postcss.config.js`

The PostCSS configuration needs to be updated to use the standard Tailwind CSS v3 plugin.

**Current `postcss.config.js`:**

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    // autoprefixer: {}, // Temporarily commented out
  },
}
```

**New `postcss.config.js`:**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {}, // This will use the installed tailwindcss (v3)
    autoprefixer: {},
  },
}
```

**Action:**
Replace the content of `postcss.config.js`.

## 3. Update `tailwind.config.ts`

The `tailwind.config.ts` file requires two main adjustments:

- **Content Paths**: The `content` array needs to be updated to correctly point to source files, primarily within the `src` directory.
- **Keyframes Syntax**: The `height: 0` in `keyframes` should be `height: "0"`.

**Current relevant `content` array snippet:**

```typescript
  content: [
    "./pages/**/*.{ts,tsx}",       // Likely incorrect if using src/app
    "./components/**/*.{ts,tsx}",  // Likely incorrect if components are in src/components
    "./app/**/*.{ts,tsx}",         // Likely incorrect if using src/app
    "./src/**/*.{ts,tsx}",         // Good, but can be more specific
    "*.{js,ts,jsx,tsx,mdx}",      // Too broad, might pick up root files unnecessarily
  ],
```

**Proposed `content` array:**

```typescript
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", // If you still use a pages directory inside src
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // Add other specific directories inside src if needed, e.g.:
    // "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
```

_Note: The user query specified "./src/app/**" and "./src/components/**". If a `./src/pages` directory exists and is used, it should also be included. Will stick to user-provided paths initially._

**Current `keyframes`:**

```typescript
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
```

**New `keyframes`:**

```typescript
      keyframes: {
        "accordion-down": {
          from: { height: "0" }, // Changed from 0 to "0"
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }, // Changed from 0 to "0"
        },
      },
```

**Action:**
Modify the `content` array and `keyframes` in `tailwind.config.ts`.

## 4. Environment Cleanup and Reinstallation

After the code changes are applied, the following steps are crucial:

1.  **Delete `node_modules` folder**: `rm -rf node_modules`
2.  **Delete lock file**: `rm yarn.lock` (assuming yarn, or `package-lock.json` for npm)
3.  **Install dependencies**: `yarn install` (or `npm install`)
4.  **Delete Next.js cache**: `rm -rf .next`
5.  **Run development server**: `yarn dev`

## 5. Create Architectural Decision Record (ADR)

An ADR will be created to document the rationale for reverting Tailwind CSS to v3.
**File:** `docs/adr/0001-revert-tailwind-css-to-v3.md`

## 6. (Optional but Recommended) Downgrade Other Pre-release Packages

Consider downgrading Next.js and React to more stable versions if issues persist or for better project stability:

- **Next.js**: `^15.2.0` (Pre-release) -> `^14.x.x` (e.g., `^14.2.3`)
- **React**: `^19.0.0` (Recent Stable/RC) -> `^18.x.x` (e.g., `^18.3.1`)
  This step is not part of the immediate changes but should be considered.

This plan addresses the critical Tailwind CSS issues.
