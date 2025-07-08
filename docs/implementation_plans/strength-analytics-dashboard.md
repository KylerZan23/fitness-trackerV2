# Strength Analytics Dashboard Implementation Plan

## Overview
Transform the generic `/progress` page into a dedicated strength analytics dashboard with comprehensive data visualization and key strength metrics.

## Data Sources & Architecture

### Database Integration
- **Primary Data Source**: `get_user_activity_summary` RPC function
- **1RM Sources**: User onboarding data (`squat1RMEstimate`, `benchPress1RMEstimate`, `deadlift1RMEstimate`, `overheadPress1RMEstimate`)
- **Workout History**: `workouts` table for progression tracking
- **Weight Unit**: User profile preference (`kg` or `lbs`)

### e1RM Calculation Strategy
Multiple formulas for estimated 1-rep max calculation:
- **Epley Formula**: `weight × (1 + 0.0333 × reps)`
- **Brzycki Formula**: `weight × (36 / (37 - reps))`
- **McGlothin Formula**: `weight × (100 / (101.3 - 2.67123 × reps))`
- **Lombardi Formula**: `weight × (reps^0.10)`

Use Epley as primary with fallback validation using Brzycki for consistency.

## Component Architecture

### 1. StatsCard Component (`src/components/ui/StatsCard.tsx`)
```typescript
interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}
```

### 2. StrengthVitals Section
Display key strength metrics in a grid layout:
- **Squat e1RM**: Current estimated 1-rep max
- **Bench Press e1RM**: Current estimated 1-rep max  
- **Deadlift e1RM**: Current estimated 1-rep max
- **7-Day Volume**: Total weight × sets × reps for last 7 days

### 3. StrengthProgressionChart Component (`src/components/progress/StrengthProgressionChart.tsx`)
```typescript
interface StrengthProgressionChartProps {
  workoutHistory: WorkoutData[]
  weightUnit: 'kg' | 'lbs'
  className?: string
}
```

Features:
- **Lift Selection Dropdown**: Squat, Bench Press, Deadlift, Overhead Press
- **e1RM Timeline**: Line chart showing strength progression over time
- **Data Points**: Calculate e1RM for each workout session
- **Trend Analysis**: Show improvement/decline trends
- **Interactive Tooltips**: Detailed workout information on hover

### 4. Enhanced MuscleDistributionChart
Add toggle functionality:
- **Total Sets View**: Current implementation
- **Total Volume View**: Sets × Reps × Weight aggregation
- **Toggle Component**: Switch between views seamlessly

## Implementation Steps

### Phase 1: Core Infrastructure
1. **Create e1RM Utilities** (`src/lib/utils/strengthCalculations.ts`)
   - Implement multiple e1RM formulas
   - Create workout data aggregation functions
   - Add trend calculation utilities

2. **Create StatsCard Component**
   - Reusable card component for key metrics
   - Trend indicators and icons
   - Responsive design with proper spacing

### Phase 2: Data Processing
3. **Enhance Data Fetching**
   - Integrate `get_user_activity_summary` RPC call
   - Calculate e1RM values from workout history
   - Aggregate 7-day volume metrics
   - Process strength progression timeline

### Phase 3: Chart Components
4. **Create StrengthProgressionChart**
   - Line chart with react-chartjs-2
   - Dropdown for lift selection
   - e1RM calculation and plotting
   - Interactive tooltips and hover states

5. **Enhance MuscleDistributionChart**
   - Add volume calculation mode
   - Toggle between sets and volume views
   - Maintain existing functionality

### Phase 4: Page Integration
6. **Transform Progress Page**
   - Replace generic content with strength analytics
   - Implement comprehensive data fetching
   - Add StrengthVitals cards at top
   - Integrate StrengthProgressionChart
   - Position enhanced MuscleDistributionChart

## Data Flow Architecture

```
Progress Page Load
    ↓
Fetch User Profile → Get Weight Unit Preference
    ↓
Call get_user_activity_summary RPC → Get 30-day summary
    ↓
Fetch Workout History → Last 6 months for progression
    ↓
Calculate e1RM Values → Process each workout session
    ↓
Aggregate Metrics → 7-day volume, current e1RMs
    ↓
Render Components → StatsCards, Charts, Visualizations
```

## Key Calculations

### e1RM from Workout Data
```typescript
// For each workout with sets/reps/weight
const calculateE1RM = (weight: number, reps: number, formula: 'epley' | 'brzycki' = 'epley') => {
  if (reps === 1) return weight;
  
  switch (formula) {
    case 'epley':
      return weight * (1 + 0.0333 * reps);
    case 'brzycki':
      return weight * (36 / (37 - reps));
    default:
      return weight * (1 + 0.0333 * reps);
  }
}
```

### 7-Day Volume Calculation
```typescript
const calculate7DayVolume = (workouts: Workout[], weightUnit: string) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return workouts
    .filter(w => new Date(w.created_at) >= sevenDaysAgo)
    .reduce((total, workout) => {
      return total + (workout.sets * workout.reps * workout.weight);
    }, 0);
}
```

## UI/UX Considerations

### Responsive Design
- **Desktop**: 4-column grid for StatsCards
- **Tablet**: 2-column grid with proper spacing
- **Mobile**: Single column with full-width cards

### Loading States
- **Skeleton components** during data fetching
- **Progressive loading** for charts and metrics
- **Error boundaries** for failed data loading

### Accessibility
- **Proper ARIA labels** for charts and metrics
- **Keyboard navigation** for dropdown selections
- **Screen reader support** for all statistical data

## Performance Optimizations

### Data Caching
- **Client-side caching** of calculated e1RM values
- **Memoization** of expensive calculations
- **Debounced updates** for real-time interactions

### Chart Optimization
- **Data point limiting** for large datasets
- **Virtual scrolling** for extensive workout history
- **Lazy loading** of non-critical chart components

## Testing Strategy

### Unit Tests
- e1RM calculation functions
- Data aggregation utilities
- Component rendering logic

### Integration Tests
- RPC function integration
- Chart data flow
- User interaction workflows

### Performance Tests
- Large dataset handling
- Chart rendering performance
- Mobile responsiveness

## Success Metrics

### User Engagement
- **Time on progress page** increase
- **Chart interaction frequency**
- **Feature utilization rates**

### Data Accuracy
- **e1RM calculation precision**
- **Trend analysis accuracy**
- **Volume calculation correctness**

## Future Enhancements

### Advanced Analytics
- **Strength ratio analysis** (Squat:Bench:Deadlift ratios)
- **Velocity-based training** metrics
- **Periodization tracking** and recommendations

### Social Features
- **Strength leaderboards** within user groups
- **Progress sharing** capabilities
- **Community challenges** based on strength metrics

## Dependencies

### External Libraries
- `react-chartjs-2`: Already installed ✅
- `chart.js`: Chart rendering engine
- `date-fns`: Date manipulation utilities ✅

### Internal Dependencies
- `get_user_activity_summary` RPC: Database function ✅
- User onboarding 1RM data: Available ✅
- MuscleDistributionChart: Existing component ✅

## Risk Mitigation

### Data Quality
- **Validation of workout data** before e1RM calculation
- **Fallback calculations** for incomplete data
- **Error handling** for malformed database responses

### Performance Risks
- **Query optimization** for large workout datasets
- **Progressive chart loading** for extensive history
- **Memory management** for complex visualizations

---

**Implementation Priority**: High impact strength analytics that provide immediate value to users while maintaining excellent performance and user experience. 