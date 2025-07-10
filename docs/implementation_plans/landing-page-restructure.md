# Landing Page Structure Rebuild - Implementation Plan

## Objective
Create a modular, reusable landing page architecture by building 5 dedicated components and completely restructuring the main page.

## New Directory Structure
```
src/components/landing/
├── HeroSection.tsx      - Main hero with "Stop Guessing. Start Progressing." headline
├── SocialProof.tsx      - Media outlets logos and star ratings (Trustpilot-style)
├── FeatureSection.tsx   - Grid layout showcasing core app features
├── Testimonials.tsx     - User testimonials with quotes, names, and photos
└── HowItWorks.tsx       - 3-step process: Onboard → Get Program → Train & Track
```

## Component Specifications

### 1. HeroSection.tsx
- **Headline (h1)**: "Stop Guessing. Start Progressing."
- **Sub-headline (p)**: Compelling description
- **Primary CTA**: "Get Started" button linking to `/signup`
- **Design**: Hero layout with engaging visual elements

### 2. SocialProof.tsx
- **Media Logos**: Placeholder text for "Men's Health," "Forbes," etc.
- **Star Ratings**: Trustpilot-style rating display
- **Layout**: Professional logo grid with rating section

### 3. FeatureSection.tsx
- **Grid Layout**: Responsive feature showcase
- **Features**: 
  - "AI Program Generation" with Lucide icon
  - "Holistic Progress Tracking" with Lucide icon
  - Additional core features
- **Structure**: Icon + Title + Description per item

### 4. Testimonials.tsx
- **Content**: 2-3 hardcoded user quotes
- **Elements**: User names and placeholder photos
- **Design**: Professional testimonial card layout

### 5. HowItWorks.tsx
- **Steps**: 
  1. Onboard
  2. Get Program  
  3. Train & Track
- **Format**: Numbered, step-by-step component
- **Design**: Clear, sequential flow visualization

## Page Refactor
- **File**: `src/app/page.tsx`
- **Action**: Complete content replacement
- **New Structure**: Import and render 5 new components in logical order
- **Maintain**: Header and footer structure, authentication logic

## Success Criteria
- [x] Landing directory created with 5 components
- [x] HeroSection with exact headline and CTA
- [x] SocialProof with media logos and ratings
- [x] FeatureSection with grid layout and Lucide icons
- [x] Testimonials with hardcoded content
- [x] HowItWorks with 3-step process
- [x] page.tsx completely refactored
- [x] All components use new brand-primary theme
- [x] Responsive design maintained

## Design Integration
- Use new `brand-primary` coral/orange theme
- Maintain existing responsive design patterns
- Ensure consistent component spacing and typography
- Integrate with existing UI component library

## Confidence Level: 9/10
High confidence with clear component specifications and straightforward React implementation. 