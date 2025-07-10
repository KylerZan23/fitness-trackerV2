# Core Visual Theme Establishment - Implementation Plan

## Objective
Establish a vibrant coral/orange brand color as the primary action color, creating a cohesive visual theme reminiscent of Runna's energetic feel.

## Changes Required

### 1. Tailwind Configuration Updates
- **File**: `tailwind.config.ts`
- **Action**: Expand `theme.extend.colors.brand` to include new primary color variants
- **New Colors**:
  - `brand-primary`: `#FF6B47` (vibrant coral-orange for main actions)
  - `brand-light`: `#FFF4F2` (light coral for backgrounds)
  - `brand-dark`: `#E5472A` (dark coral for hover states)

### 2. Primary Theme Refactor
- **File**: `tailwind.config.ts`  
- **Action**: Update existing `primary.DEFAULT` to reference new `brand-primary`
- **Change**: From `hsl(240 5.9% 10%)` to coral/orange equivalent

### 3. Button Component Verification
- **File**: `src/components/ui/button.tsx`
- **Action**: Verify default variant correctly uses updated primary theme
- **Expected**: No changes needed as it already references `bg-primary`

## Color Palette Specification
```css
brand-primary: #FF6B47  /* Main coral-orange */
brand-light: #FFF4F2   /* Light background variant */
brand-dark: #E5472A    /* Dark hover variant */
```

## Assumptions
- Existing components using `primary` colors will automatically inherit new theme
- No breaking changes to existing color system
- HSL format preferred for consistency with existing theme

## Success Criteria
- [x] New brand colors defined in tailwind config
- [x] Primary color updated to use brand-primary
- [x] Button component displays with new coral/orange theme
- [x] No visual regressions in existing components

## Confidence Level: 9/10
High confidence due to straightforward color configuration with clear requirements. 