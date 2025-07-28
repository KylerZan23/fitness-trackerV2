# NeuralLift - AI-Powered Fitness Tracker

A comprehensive fitness tracking application powered by Next.js and Supabase, featuring AI-driven program generation, community features, and real-time progress tracking.

## Recent Updates

### Individualized Weak Point Targeting System (Latest)
✅ **Intelligent Strength Assessment and Targeted Accessory Programming**
- **Strength Ratio Analysis**: Automatic identification of muscular imbalances and weak points
  - Deadlift/Squat ratio analysis (target: 1.2-1.3) for posterior chain health assessment
  - Bench/Squat ratio analysis (target: 0.6-0.8) for upper/lower body balance evaluation
  - OHP/Bench ratio analysis (target: 0.6-0.7) for shoulder stability and overhead strength
- **Priority-Based Weak Point Identification**: Systematic assessment using professional coaching standards
  - Injury-specific considerations (back, knee, shoulder) receive highest priority
  - Major strength imbalances (posterior chain, pressing weaknesses) addressed systematically  
  - Goal-specific weak points (hypertrophy specialization, advanced core work) incorporated
  - General muscle balance fallback when insufficient data available
- **Targeted Accessory Programming**: Dedicated exercise slots for identified weak points
  - Posterior chain weakness → Romanian Deadlifts, Good Mornings, Hip Thrusts
  - Upper body pressing weakness → Close-Grip Bench, Incline Press, Tricep work
  - Overhead pressing weakness → Seated DB Press, Lateral Raises, Face Pulls
  - Injury-based targeting → Evidence-based rehabilitation exercises (McGill Big 3, Dead Bug, Bird Dog)
- **Educational Weak Point Rationale**: Users learn about their specific imbalances
  - Clear explanations of strength ratios and what they indicate
  - Scientific rationale for each recommended exercise selection
  - Understanding of how weak point work supports main lift progress
- **Professional Assessment Integration**: Mirrors elite strength coaching practices
  - Evidence-based strength ratio targets from sports science research
  - Proactive imbalance correction before problems develop
  - Individualized programming based on actual assessment data

### Progression Strategy Field Implementation
✅ **Dynamic Training Guides with Explicit Progression Instructions**
- **Week-Specific Progression Strategies**: Clear instructions for week-to-week advancement
  - Week 1: "Start conservatively at prescribed weights and RPE 6-7 targets"
  - Week 2: "Add 2.5kg to lower body compounds, 1.25kg to upper body compounds"
  - Week 3: "Continue progressive weight increases maintaining RPE 6-7"
  - Week 4: "Reduce weights by 10% and focus on form refinement for deload"
- **Phase-Level Progression Strategies**: Overall approach explanation for entire training phase
  - Linear models: "Simple linear weight increases each week while maintaining set/rep schemes"
  - Undulating models: "Progressive volume accumulation from MEV to MAV over 3 weeks, followed by deload"
  - Autoregulated models: "Autoregulated progression based on daily readiness and performance feedback"
- **Experience-Appropriate Complexity**: Progression instructions match user capability
  - Beginner: Simple weight increments with form focus (2.5kg/5lbs progressions)
  - Intermediate: Systematic progressions integrating volume and intensity concepts
  - Advanced: Autoregulated progressions based on readiness and performance feedback
- **Educational Progression Guidance**: Users learn progressive overload principles
  - Clear explanations of how and why to progress
  - Integration with volume landmarks (MEV/MAV/MRV) and RPE systems
  - Deload strategy education and implementation
- **Dynamic Training Programs**: Static plans become actionable progression guides
  - Explicit instructions eliminate guesswork
  - Week-to-week advancement clearly defined
  - Systematic overload application for continued adaptations

### Enhanced Exercise Selection & SFR Optimization
✅ **Intelligent Exercise Selection with Stimulus-to-Fatigue Ratio Optimization**
- **Goal-Specific Exercise Hierarchies**: Different exercise priorities for different training goals
  - Hypertrophy: Machine > Cable > Dumbbell > Barbell (for isolation and muscle focus)
  - Strength: Competition lift > Variation > Accessory (for movement specificity)
  - General Fitness: Compound movements covering all major movement patterns
- **Intelligent Substitution Logic**: Equipment and injury constraints handled with SFR preservation
  - Equipment limitations: Barbell → Dumbbell → Bodyweight progressions
  - Injury modifications: Safe alternatives maintaining muscle group training
  - Experience adjustments: Machine → Dumbbell → Barbell complexity progression
- **Educational Exercise Notes**: Users understand why exercises were selected
  - SFR optimization explanations for each exercise choice
  - Substitution rationale when equipment or injury modifications applied
  - Movement pattern and muscle group training explanations
- **Comprehensive Injury Accommodation**: Sophisticated injury modification protocols
  - Knee pain: Box squats, leg press, hip thrusts (knee-sparing alternatives)
  - Shoulder impingement: Landmine press, neutral grip positions
  - Lower back issues: Trap bar deadlifts, supported variations
- **Experience-Appropriate Progressions**: Exercise complexity matches user capability
  - Beginner: Stable, machine-based exercises with detailed form cues
  - Intermediate: Dumbbell and barbell variations with unilateral work
  - Advanced: Complex movement patterns and advanced techniques

### Scientific Volume Landmarks Integration
✅ **Precision Volume Programming with MEV/MAV/MRV Framework**
- **Scientific Volume Landmarks**: Programs now use established research-based volume targets
  - MEV (Minimum Effective Volume): Starting point for each mesocycle
  - MAV (Maximum Adaptive Volume): Optimal volume for peak adaptations
  - MRV (Maximum Recoverable Volume): Safety limit to prevent overreaching
- **Experience-Appropriate Volume Ranges**: Tailored to individual training background
  - Beginner: MEV 8-10, MAV 12-16, MRV 18 sets/muscle/week
  - Intermediate: MEV 10-12, MAV 18-22, MRV 24 sets/muscle/week
  - Advanced: MEV 12-15, MAV 20-25, MRV 26-28 sets/muscle/week
- **4-Week Volume Progression**: Systematic progression optimizing stimulus and recovery
  - Week 1: Start at MEV (baseline stimulus)
  - Week 2: Progress toward MAV (add 2-4 sets across key muscle groups)
  - Week 3: Approach MAV without exceeding MRV (peak volume week)
  - Week 4: Return to MEV levels (50-60% volume reduction for deload)
- **Intelligent Set Counting**: AI accurately counts sets per muscle group across exercises
  - Primary muscle contributions weighted appropriately
  - Secondary muscle involvement properly attributed
  - Weekly totals aligned with scientific volume landmarks
- **Recovery Optimization**: Built-in deload programming prevents overreaching
  - Systematic volume reduction every 4th week
  - Return to MEV levels for supercompensation
  - Integration with RPE-based intensity management

### Dynamic Autoregulated Periodization
✅ **Advanced Evidence-Based Program Generation**
- **4-Week Undulating Periodization**: Intermediate/Advanced users receive sophisticated periodization
  - Week 1-2: Volume accumulation phase (RPE 7-8, 2-3 RIR)
  - Week 3: Intensification phase (RPE 8-9, 1-2 RIR, reduced accessory volume)
  - Week 4: Systematic deload (RPE 5-6, 4-5 RIR, 40-50% volume reduction)
- **Linear Progression for Beginners**: Conservative progression with technique focus
  - Consistent set/rep schemes with gradual weight increases
  - Conservative RPE targets (6-7) prioritizing movement quality
  - Detailed form cues and safety reminders
- **Systematic RPE/RIR Autoregulation**: All exercises receive intelligent intensity guidance
  - "Select weight for 10 reps at RPE 8 (leaving 2 reps in the tank)"
  - Experience-appropriate RPE targets based on training background
  - Built-in RPE education with clear explanations
- **Enhanced Weight Prescription**: Sophisticated load selection for all exercises
  - Percentage-based loading for compound exercises with 1RM data
  - RPE-based guidance for accessories and isolation movements
  - Autoregulation principles for daily intensity adjustments
- **Professional-Grade Programming**: Matches commercial coaching standards
  - Evidence-based periodization models from current research
  - Experience-level appropriate progression strategies
  - Systematic recovery and supercompensation protocols

### Profile Enhancement & Personal Records Editing
✅ **Complete Profile Editing & Personal Records Management**
- **Profile Picture Upload**: Integrated profile picture editing with hover overlay
  - Click-to-edit functionality directly from profile header
  - Modal-based upload interface with image validation
  - Real-time updates with automatic profile refresh
- **Editable Profile Fields**: Inline editing for personal information
  - Age input with validation (13-120 years)
  - Height input supporting both metric (cm) and imperial (feet/inches)
  - Weight input with automatic unit conversion (kg/lbs)
  - Save/cancel functionality with error handling
- **Personal Records Editing**: Full CRUD operations for personal records
  - Inline editing for weight and reps with proper validation
  - Add new personal records for Squat, Bench Press, Deadlift, Overhead Press
  - Delete existing personal records with confirmation
  - E1RM validation ensures only true personal records are saved
  - Real-time updates with automatic data refresh
- **Activity Feed Improvements**: Collapsible activity section
  - Dropdown toggle to show/hide recent activity
  - Activity count indicator and smooth animations
  - Configurable default expanded/collapsed state
- **UI/UX Improvements**: Removed hardcoded text and enhanced user experience
  - Removed "5+ Years" text from Advanced experience level 
  - Removed "Prime Age" badge from age statistics
  - Clean, intuitive editing interface with proper validation
- **Enhanced Server Actions**: Extended `profileActions.ts` with comprehensive update capabilities
  - `updateProfileBasicInfo()`: Updates age, height, weight with validation
  - `updateProfilePicture()`: Handles profile picture URL updates
  - `updatePersonalRecord()`: Creates/updates personal records via workout data
  - `deletePersonalRecord()`: Removes personal records safely
  - E1RM calculation integration and comprehensive validation

### Profile Backend Integration
✅ **Complete Backend Integration for Profile Page**
- **New Server Actions**: Created `profileActions.ts` with comprehensive data fetching
  - `getUserProfileData()`: Fetches complete profile with enhanced fields
  - `getUserWorkoutStats()`: Calculates real-time workout statistics
  - `getUserPersonalRecords()`: Computes PRs with monthly progress tracking
  - `getUserActivityFeed()`: Loads activity timeline from database events
- **Real Data Integration**: Replaced all hardcoded fallback data with live database queries
- **Performance Optimized**: Parallel data fetching and intelligent caching
- **Type Safety**: Full TypeScript support with proper error handling

**Enhanced Profile Features:**
- Real workout statistics (total workouts, PRs count, weekly averages)
- Calculated personal records for main lifts (Squat, Bench, Deadlift, OHP)
- Monthly progress tracking with percentage improvements
- Activity feed from community events and workout completions
- Proper unit conversion (kg/lbs) support
- Fallback handling for missing data

### Community & Social Features
✅ **Community Groups & Posts System**
- Create and join specialized fitness communities
- Post content with voting and commenting system
- Group-specific feeds and global timeline
- Comprehensive RLS policies for data security

### AI-Powered Training Programs
✅ **Intelligent Program Generation**
- LLM-powered training program creation based on user goals
- Structured workout days with exercises, sets, reps, and progression
- Integration with onboarding data for personalized recommendations
- Support for various training styles and experience levels

### Workout Tracking
✅ **Comprehensive Exercise Logging**
- Exercise tracking with sets, reps, weight, and duration
- Muscle group categorization and distribution analysis
- Personal record calculation and progression tracking
- Monthly workout calendar view with detailed statistics

### Analytics & Progress
✅ **Advanced Progress Tracking**
- E1RM (Estimated 1-Rep Max) calculations using multiple formulas
- Strength progression charts and trend analysis
- **Enhanced Muscle Group Categorization**: Intelligent exercise classification that handles LLM-generated variations (e.g., "Dumbbell Bench Press", "Romanian Deadlifts")
- Muscle distribution heatmaps and volume tracking with accurate categorization
- Weekly and monthly progress summaries

### Onboarding Experience
✅ **Comprehensive User Setup**
- Multi-step onboarding with fitness goals assessment
- Strength level evaluation for major lifts
- Equipment and preference selection
- Training frequency and experience level setup

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with session management
- **Styling**: Tailwind CSS with shadcn/ui components
- **Language**: TypeScript
- **Charts**: Recharts for data visualization
- **Testing**: Jest and React Testing Library

## Database Schema

### Core Tables
- `profiles`: User information and preferences
- `workouts`: Exercise logs with performance data
- `community_groups`: Fitness communities and specializations
- `community_posts`: User-generated content with voting
- `community_feed_events`: Activity timeline and notifications
- `training_programs`: AI-generated workout programs

### Key Features
- Comprehensive RLS policies for data security
- Optimized indexes for performance
- JSONB fields for flexible data storage
- Foreign key constraints for data integrity

## Development

### Prerequisites
- Node.js 18+
- Yarn package manager
- Supabase account and project

### Setup
1. Clone the repository
2. Install dependencies: `yarn install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations
5. Start development server: `yarn dev`

### Key Commands
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run test suite
- `yarn lint` - Run ESLint

## Architecture

### Server Actions
- **Profile Management**: `profileActions.ts` - Real-time data fetching and calculations
- **AI Programs**: `aiProgramActions.ts` - LLM integration and program generation
- **Community**: `communityActions.ts` - Social features and content management
- **Workouts**: Database operations and analytics

### Component Structure
- **Profile Components**: Modern social-style profile with real data integration
- **Dashboard**: Interactive charts and progress tracking
- **Onboarding**: Multi-step user setup flow
- **Community**: Social features and content sharing

### Data Flow
1. Client components trigger server actions
2. Server actions authenticate and validate requests
3. Database queries with RLS policy enforcement
4. Real-time calculations and data processing
5. Type-safe data return to components

## Security

- Row Level Security (RLS) policies on all tables
- Server-side authentication validation
- Input sanitization and validation
- CSRF protection with Next.js
- Environment variable validation

## Performance

- Parallel data fetching with Promise.all()
- Database query optimization with indexes
- Client-side caching strategies
- Lazy loading for large datasets
- Optimized bundle splitting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Recent Bug Fixes

### Personal Records Unit Conversion Fix (2025-01-27)
Fixed a critical issue where users entering personal records during onboarding in lbs would see incorrect values on their profile page due to double unit conversion.

**Issue:** Users entering PRs like 225 lbs squat would see 496 lbs displayed on their profile
**Root Cause:** Onboarding stored values in user's preferred units, but display logic assumed all stored values were in kg and applied conversion
**Fix:** Onboarding now consistently stores all strength data in kg, with proper unit conversion on display

**For affected users:** Use the manual fix script `fix-pr-values-manual.sql` or contact support. See ADR-044 for technical details.

## License

MIT License - see LICENSE file for details

---

**NeuralLift** - Transforming fitness through intelligent technology
