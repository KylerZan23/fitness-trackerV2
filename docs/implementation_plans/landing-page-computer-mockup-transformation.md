# Landing Page Computer Mockup Transformation

## Objective
Replace the phone mockup in the HeroSection with a computer/laptop display showing the /program page interface to better demonstrate the desktop experience.

## Current State Analysis
- **Phone mockup**: 280px x 560px mobile device with realistic phone styling
- **Content**: Compressed mobile-optimized program interface
- **Visual**: Phone frame with notch, rotation effect, mobile spacing

## Target Design
- **Computer mockup**: Laptop/desktop display with proper aspect ratio
- **Content**: Desktop-optimized program page layout
- **Visual**: Modern laptop frame with screen bezel, flat design

## Implementation Plan

### 1. Container Transformation
- **Current**: `w-[280px] h-[560px]` phone with rounded corners
- **New**: `w-[640px] h-[400px]` laptop with 16:10 aspect ratio
- **Frame**: Dark laptop bezel with silver/gray accents
- **Remove**: Phone notch, excessive rounding, mobile rotation

### 2. Content Adaptation
- **Scale up**: Text sizes from `text-xs` to `text-sm/text-base`
- **Layout**: Wider grid layouts for better desktop utilization
- **Spacing**: Increase padding and gaps for desktop viewing
- **Navigation**: Add browser-like header with URL bar simulation

### 3. Program Page Content Mapping
From the actual program page structure:
- **Header**: Browser-like navigation with NeuralLift branding
- **Main Content**: 
  - Coach intro message (blue gradient card)
  - Today's Session card (larger, more prominent)
  - Stats grid (3-column layout with better spacing)
  - Program overview section
  - Scientific rationale preview

### 4. Visual Enhancements
- **Browser Frame**: Simulate browser window with close/minimize buttons
- **URL Bar**: Show "/program" URL for authenticity
- **Shadow**: Desktop-appropriate drop shadow
- **Hover Effect**: Subtle scale or glow instead of rotation

## Technical Implementation

### Container Structure
```tsx
<div className="relative w-[640px] h-[400px] bg-gray-800 rounded-lg border-2 border-gray-700 shadow-2xl transform hover:scale-105 transition-transform duration-300">
  {/* Laptop screen bezel */}
  <div className="absolute top-2 left-2 right-2 bottom-2 bg-black rounded-md overflow-hidden">
    {/* Browser window */}
    <div className="h-full bg-white flex flex-col">
      {/* Browser header */}
      {/* Main content */}
    </div>
  </div>
</div>
```

### Content Scaling
- **Typography**: Increase all text sizes by 2-3 levels
- **Icons**: Scale from `w-3 h-3` to `w-5 h-5`
- **Spacing**: Double padding and margins
- **Grid**: Use full desktop grid layouts

### Browser Simulation
- **Header**: Traffic light buttons (red, yellow, green)
- **URL Bar**: Realistic address bar with "neurallift.com/program"
- **Navigation**: Back/forward buttons (optional)

## Expected Outcomes

### User Experience
- **Better Demonstration**: Shows actual desktop interface
- **Increased Credibility**: Matches real application experience
- **Improved Conversion**: Desktop users see relevant interface

### Technical Benefits
- **Maintainable**: Uses existing design system components
- **Responsive**: Adapts to different screen sizes
- **Consistent**: Matches actual program page styling

## Files to Modify
- `src/components/landing/HeroSection.tsx` - Main implementation

## Success Criteria
- ✅ Laptop/computer visual design
- ✅ Realistic program page content
- ✅ Proper scaling and typography
- ✅ Desktop-appropriate spacing and layout
- ✅ Browser window simulation
- ✅ Maintains responsive behavior

## Future Enhancements
- Add subtle screen reflection effects
- Animate individual elements within the mockup
- A/B test different laptop orientations
- Add keyboard/trackpad below screen for full laptop effect