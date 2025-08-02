# NeuralLift - AI-Powered Fitness Tracker

A comprehensive fitness tracking application powered by Next.js and Supabase, featuring AI-driven program generation, community features, and real-time progress tracking. Includes multi-tier subscription system with Pro tier Advanced Analytics and external Trainer API for programmatic access.

## Recent Updates

### Robust AI Program Generation
✅ **Enhanced Reliability for AI-Powered Features**
- **Invalid JSON Error Fixed**: Resolved a critical bug where the AI model would occasionally return non-JSON text, causing program generation to fail.
- **JSON Output Strictness**: The AI model now adheres to a strict protocol, returning only a single, valid, and minified JSON object without any additional text or formatting. This eliminates previous issues with extraneous characters or markdown.
- **Robust Parsing Logic**: Implemented a resilient parsing system that intelligently extracts the valid JSON object from the AI's response, even if it's surrounded by conversational text (this is a fallback and the AI is prompted for clean output).
- **Stricter AI Prompting**: Enhanced the instructions sent to the AI to be extremely explicit about returning *only* a single, valid, minified JSON object, significantly reducing the likelihood of errors.
- **Improved User Experience**: Users will now experience fewer failures during the critical onboarding and program generation flows, leading to higher trust and satisfaction.
- **Standardized Error Handling**: Established a new, more robust pattern for handling AI interactions that will be applied across all AI-powered features in the application.

### Trainer API Endpoint System (Latest)
✅ **External API Access for Fitness Professionals**
- **API Key Authentication System**: Secure, scope-based authentication for external access
  - SHA-256 hashed API keys with configurable permissions (`program:generate`, `program:read`, etc.)
  - Rate limiting with hourly and daily limits per API key
  - Usage tracking and analytics for monitoring and billing
  - Secure key distribution with one-time visibility during creation
- **Program Generation API**: `/api/v1/trainer/generate-program` endpoint
  - Leverages existing AI program generation engine with full complexity support
  - Accepts structured user biometrics, training goals, and experience data
  - Returns complete training programs with scientific rationale and periodization
  - Comprehensive request/response validation using Zod schemas
- **Developer Experience**: Professional API documentation and tools
  - Complete API documentation with examples and error codes
  - CORS support for web applications
  - Standardized error response format with detailed validation messages
  - Admin management interface for API key lifecycle (creation, monitoring, deactivation)
- **Security and Reliability**: Enterprise-grade API infrastructure
  - Automatic cleanup of usage logs (30-day retention)
  - Database migrations for API key management
  - Environment variable validation for API configuration
  - Architecture Decision Record (ADR-072) documenting design decisions

### Dedicated Upgrade Page Implementation
✅ **Personalized Upgrade Experience with Dynamic Progress Tracking**
- **Dynamic User Progress Display**: Compelling data-driven upgrade experience at `/upgrade`
  - Fetches and displays user workout statistics (total workouts, weight lifted, weekly averages)
  - Personalized messaging highlighting user's fitness journey and achievements
  - Most active day tracking and monthly workout count displays
  - Visual progress cards with engaging icons and clear metrics
- **Contextual Upgrade Messaging**: Smart messaging based on user context
  - **Trial Expired**: "Your 7-Day Trial Has Ended" with progress emphasis
  - **Feature Locked**: "Unlock [feature]" with targeted upgrade prompts
  - Query parameter support for context (`?expired=true&feature=AI%20Coach`)
  - Dynamic back navigation based on referral source
- **Integrated Stripe Checkout**: Seamless payment processing
  - Reuses existing `createCheckoutSession` server action
  - Monthly ($9.99) and Annual ($39.99) subscription options
  - "Most Popular" badge highlighting 67% annual savings
  - Complete feature list with checkmarks for both plans
- **Professional UI Design**: Trust-building upgrade interface
  - Gradient background with clean card-based layout
  - Trust indicators (7-day trial, cancel anytime, secure payment)
  - Error handling with user-friendly messaging
  - Loading states during Stripe checkout process
  - Mobile-responsive design matching existing app aesthetic

### Premium Feature Paywall Implementation
✅ **Comprehensive Subscription-Based Access Control**
- **Premium Route Protection**: Middleware-level route protection for core premium features
  - AI Coach features fully protected at `/ai-coach` route
  - Expired trial users automatically redirected to upgrade page
  - Clear messaging about feature requirements and trial status
- **Training Program Generation Restrictions**: Enhanced subscription checks for program creation
  - Multiple validation layers in server actions and UI components
  - Graceful error handling with upgrade prompts
  - Automatic redirect to upgrade page for expired users
- **Week-Based Workout Plan Access**: Progressive content unlocking system
  - **Trial Users**: Access to first 2 weeks of training program
  - **Premium Users**: Full access to all program weeks and phases
  - Visual indication of locked content with upgrade prompts
  - Subscription-gated accordion components with premium badges
- **Dedicated Pricing Page**: Professional pricing interface at `/pricing`
  - Dynamic trial expiration messaging based on user status
  - Feature-specific upgrade prompts with context
  - Integration with existing Stripe checkout system
  - Clean user experience with FAQ section and upgrade paths
- **Enhanced User Experience**: Clear value proposition and upgrade flows
  - Contextual upgrade prompts based on accessed features
  - Trial status indicators throughout the application
  - Professional locked content styling with premium branding
  - Seamless integration with existing subscription management

### Asynchronous Program Generation Architecture
✅ **Background Processing for Enhanced User Experience**
- **Instant Response Times**: Program generation triggers now return immediately (< 1 second vs 30-60 seconds)
  - Lightweight server action creates database entry with 'pending' status
  - Supabase Edge Function processes generation in background
  - Real-time status updates via polling mechanism
- **Non-Blocking UI**: Users can continue using the app while programs generate
  - Loading states with progress indicators and messaging
  - Success notifications when generation completes
  - Comprehensive error handling with retry mechanisms
- **Enhanced Scientific Processing**: Background generation includes full AI pipeline
  - Enhanced user data processing with volume parameters
  - Individualized volume landmarks calculation
  - Weak point analysis and periodization model selection
  - Scientific autoregulation guidelines integration
- **Scalable Architecture**: Supports multiple concurrent generations
  - Edge Functions scale independently of main application
  - Better resource utilization and cost efficiency
  - Database status tracking with generation metadata
- **Robust Error Handling**: Comprehensive timeout and failure management
  - 10-minute timeout protection against infinite polling
  - Detailed error logging and user-friendly error messages
  - Automatic retry mechanisms for failed generations
  - Database consistency guarantees

### Free Trial Program Generation Fix
✅ **Comprehensive Program Generation for All Users**
- **Fixed Inadequate Free Trial Programs**: Resolved issue where free trial users received only 1 workout day with 2 exercises
  - Updated Supabase Edge Function to use comprehensive program generation logic
  - Implemented proper subscription status checking (premium vs trial)
  - Added free trial limitations (1 example week vs full program)
  - Enhanced exercise selection with proper hierarchy (compounds → isolation)
- **Improved Program Structure**: Both free trial and paid users now receive proper programs
  - **Free Trial Users**: 1 week, 4 workout days, 6 exercises per workout
  - **Paid Users**: 4 weeks, 4 workout days, 6 exercises per workout
  - Proper exercise hierarchy with anchor lifts, secondary compounds, and isolation work
  - Clear upgrade messaging for free trial users
- **Enhanced User Experience**: Better program quality and conversion potential
  - Scientific exercise selection with proper volume distribution
  - Comprehensive workout structure with warm-up, main exercises, and cool-down
  - Proper rest day scheduling and recovery management
  - Clear value proposition for upgrading to premium
- **Technical Improvements**: Robust error handling and status updates
  - Enhanced Edge Function with proper error handling
  - Database status tracking for program generation
  - Comprehensive logging for debugging and monitoring
  - Graceful fallback mechanisms for failed generation

### Training Program Caching System
✅ **Performance Optimization with Intelligent Caching**
- **24-Hour Cache Duration**: Reduces LLM API calls and improves response times
  - Cache key generation based on user profile, subscription status, and onboarding responses
  - Stable JSON stringification with sorted keys for consistent cache keys
  - Base64 hash of signature object for efficient storage and comparison
- **Smart Cache Management**: Intelligent cache hit/miss handling
  - Cache check before expensive LLM generation pipeline
  - Automatic cache invalidation via expiration timestamps
  - Graceful error handling for cache operations
- **Data Consistency**: Cached programs still saved to training_programs table
  - Ensures accurate program history tracking
  - Maintains user experience consistency
  - Preserves all program metadata and analytics
- **Database Schema**: New ai_coach_cache table with optimized indexes
  - Primary key on cache_key for fast lookups
  - Indexes on user_id/expires_at and hashed_data_input
  - Row-level security ensuring user data isolation

### Landing Page Computer Mockup Enhancement
✅ **Desktop-Optimized Program Interface Showcase**
- **Computer Display Mockup**: Replaced mobile phone mockup with laptop/desktop display
  - Realistic browser window simulation with macOS-style traffic light controls
  - Proper URL bar showing "neurallift.com/program" for authenticity
  - 680x420px desktop aspect ratio with modern laptop bezel design
  - Hover scale effect replacing mobile rotation animation
- **Desktop-Optimized Content**: Enhanced program page preview with desktop-appropriate sizing
  - Scaled-up typography (text-sm/text-base vs text-xs) for desktop readability
  - Improved spacing and padding for desktop viewing experience
  - Coach message card with AI branding and personalized welcome message
  - Enhanced today's session card with detailed workout information
  - Three-column stats grid showing streak, progress, and program duration
  - Comprehensive program overview with visual progress indicators
- **Browser-Style Interface**: Professional browser window simulation
  - Traffic light controls (red, yellow, green) for macOS authenticity
  - Realistic address bar with site URL display
  - Window control buttons (minimize, maximize, close)
  - NeuralLift app header with branding and navigation elements
- **Improved User Experience**: Better demonstration of actual desktop application
  - Shows realistic desktop workout tracking interface
  - Demonstrates professional, polished application design
  - Builds user confidence in product quality and sophistication
  - Provides accurate preview of actual user experience

### Enhanced Program Validation Schema
✅ **Comprehensive Scientific Validation for AI-Generated Programs**
- **Volume Landmark Compliance**: Automated validation ensuring no muscle group exceeds calculated MRV
  - Individual volume landmark enforcement with specific violation messages
  - MEV/MAV/MRV compliance checking with scientific rationale explanations
  - Percentage of MAV validation preventing overreaching scenarios
  - Primary muscle group minimum volume requirements for adequate stimulus
- **Autoregulation Protocol Validation**: RPE target verification and progression logic
  - Phase-specific RPE target validation (accumulation/intensification/realization/deload)
  - Logical RPE progression enforcement preventing periodization violations
  - Realistic RPE range validation (≤3 points) for effective autoregulation
  - Readiness adjustment protocol requirements for all training scenarios
- **Weak Point Intervention Verification**: Systematic validation of corrective protocols
  - Automatic detection of missing interventions for identified imbalances
  - Intervention volume sufficiency validation (minimum 2 sets/week, 4+ for high priority)
  - Reassessment period appropriateness checking (2-12 weeks maximum)
  - Priority-based intervention requirement enforcement
- **Enhanced Exercise Validation**: Scientific exercise selection and rationale requirements
  - Mandatory anchor lift validation on all training days
  - Tier classification system (Tier_1/Tier_2/Tier_3) with appropriate exercise selection
  - Stimulus-to-fatigue ratio classification and optimization
  - Scientific rationale requirements for exercise selection decisions
- **Comprehensive Error Messaging**: Educational feedback explaining violated scientific principles
  - Specific violation messages with scientific context and implications
  - Detailed error categorization (schema errors vs scientific violations)
  - Actionable suggestions for program improvement
  - Integration-ready validation results for UI error handling

### Enhanced Exercise Science LLM Guidelines
✅ **Cutting-Edge Scientific Framework for AI Program Generation**
- **Comprehensive Volume Framework**: Detailed MEV/MAV/MRV implementation with muscle-specific guidelines
  - Evidence-based volume landmarks from latest 2024-2025 research meta-analyses
  - Progressive volume application protocols with individual adjustment strategies
  - Integration with existing autoregulation and periodization systems
  - Practical examples for beginner/intermediate/advanced training populations
- **Advanced Autoregulation System**: RPE-based training optimization with real-time adjustments
  - Complete Borg CR-10 scale implementation with specific RPE targets by training phase
  - Daily readiness assessment protocols combining subjective and objective markers
  - Load adjustment matrices for high/normal/low readiness scenarios
  - Fatigue management principles preventing overreaching and optimizing recovery
- **Sophisticated Periodization Models**: Multiple evidence-based periodization approaches
  - Block periodization with accumulation/intensification/realization phases
  - Daily undulating periodization (DUP) for experienced trainees
  - Integration with existing periodization.ts models and phase definitions
  - Competition and peaking protocols for advanced athletes
- **Systematic Weak Point Intervention**: Scientific approach to strength imbalance correction
  - Research-backed strength ratio standards and assessment protocols
  - Specific exercise prescriptions for common imbalance patterns
  - Targeted intervention timelines and monitoring strategies
  - Integration with existing weak point analysis system
- **Advanced Fatigue Management**: Comprehensive recovery optimization framework
  - Multi-modal fatigue monitoring (metabolic, neurological, psychological, structural)
  - Evidence-based deload timing and implementation protocols
  - Recovery marker integration (HRV, sleep, subjective wellness)
  - Individual fatigue threshold customization and adjustment
- **Optimized Exercise Selection**: Stimulus-to-fatigue ratio optimization with movement pattern focus
  - Three-tier exercise hierarchy with equipment prioritization
  - Individual anatomical and constraint considerations
  - Goal-specific exercise selection criteria and rationale
  - Integration with existing exercise selection and SFR systems

### Mandatory Anchor Lift Implementation
✅ **Clear Training Focus with Primary Movement Priority**
- **Anchor Lift Requirement**: Every non-rest day MUST designate the first exercise as the "Anchor Lift"
  - Position: MUST be first exercise after warm-up (Tier 1, Position 1)
  - Exercise Type: Major compound movement (Squat, Bench Press, Deadlift, Overhead Press, or close variations)
  - Progression Priority: Weekly progression strategy most clearly applied to this lift
  - Primary Goal: User's main objective is to progress on this lift over the program
- **Professional Training Structure**: Mirrors elite coaching practices
  - Peak neural energy dedicated to most important movement
  - Clear hierarchy of exercise importance eliminates training confusion
  - Optimal energy allocation for compound movement mastery
  - Supporting exercises complement rather than compete with Anchor Lift
- **Enhanced Progression Focus**: Systematic advancement on primary movements
  - Volume progression prioritized for Anchor Lift before secondary exercises
  - Weight increases between mesocycles prioritize Anchor Lift development
  - Clear tracking and performance focus on most important lift
- **User Experience Benefits**: Reduced decision fatigue and clear training objectives
  - Every workout has obvious primary focus and progression target
  - Educational value in understanding exercise prioritization
  - Improved motivation through tangible focus on meaningful movements

### Refined Mesocycle Progression Strategy
✅ **Volume-Focused Progression with Clear Hierarchy**
- **Progression Hierarchy**: Systematic approach to progression methods
  - Step 1: Add reps within target rep range until TOP of range achieved for all sets
  - Step 2: Once top rep range achieved, ADD ONE SET to that exercise the following week
  - Step 3: Weight increases MINIMAL during accumulation (only when form breakdown occurs)
- **Mesocycle Structure**: Evidence-based 4-week progression model
  - Weeks 1-3 (Accumulation): Primary progression through set addition, not weight increases
  - Week 3 (Final Volume): Complete progression to MAV (Maximum Adaptive Volume)
  - Week 4 (Deload): Return to MEV levels, prepare for next mesocycle
  - After Mesocycle: Next block uses weight increases with same volume structure
- **Scientific Foundation**: Aligns with current periodization research
  - Volume progression optimizes muscle growth stimulus over weight-focused approaches
  - Set addition allows better fatigue management and recovery adaptation
  - Alternating volume/intensity focus prevents stagnation and optimizes long-term progress
- **User Education**: Clear guidance on when and how to progress
  - Specific examples for each training week and phase
  - Integration with volume landmarks (MEV/MAV/MRV) for optimal progression
  - Long-term mesocycle thinking and block periodization concepts

### Tiered Exercise Selection Within Workouts
✅ **Structured Workout Organization for Optimal Training Stimulus**
- **Three-Tier Exercise Hierarchy**: Strategic exercise ordering based on neurological demands
  - Tier 1 (Primary Compound): 1-2 exercises, free weights, 5-10 reps, RPE 7-8 (when fresh)
  - Tier 2 (Secondary): 2-3 exercises, stable variations, 8-15 reps, RPE 8-9 (hypertrophy focus)
  - Tier 3 (Isolation): 2-3 exercises, single-joint movements, 12-25 reps, RPE 9-10 (metabolic stress)
- **Equipment Priority by Tier**: Optimized for different training adaptations
  - Tier 1: Barbell > Dumbbell > Machine (maximum neural demand)
  - Tier 2: Machine > Cable > Supported Dumbbell (stability for muscle isolation)
  - Tier 3: Cable > Machine > Dumbbell (consistent tension for metabolic stress)
- **Goal-Specific Tier Applications**: Different training goals emphasize different tiers
  - Hypertrophy Goals: Tier 2 becomes primary driver with Tier 1 providing strength base
  - Strength Goals: Tier 1 takes priority with Tiers 2-3 supporting main lifts
  - General Fitness: All tiers contribute to balanced development
- **Educational Tier Guidance**: Users understand the rationale behind exercise ordering
  - Tier-specific notes explain focus and execution approach for each exercise type
  - Scientific rationale for fatigue management and neurological demand optimization
  - Integration with existing SFR optimization and periodization models

### Individualized Weak Point Targeting System
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

### Enhanced Program Display Components (Latest)
✅ **Science-Based Program Visualization & Interaction**
- **VolumeDistributionChart**: Visual representation of weekly volume vs individual MEV/MAV/MRV landmarks
  - Color-coded compliance zones (optimal, caution, above MRV)
  - Interactive tooltips with volume explanations
  - Real-time compliance indicators and recommendations
- **ScientificRationale**: Expandable sections explaining evidence-based program design
  - Research-backed exercise selection principles
  - Citation support with DOI links
  - Exercise-specific rationale with tier classification
- **AutoregulationGuidelines**: Interactive RPE implementation with daily adjustments
  - Phase-specific RPE targets with visual scale
  - Daily readiness adjustment protocols
  - Recovery markers and fatigue indicators
  - Interactive RPE logging functionality
- **WeakPointInterventions**: Detailed correction protocols with progress tracking
  - Strength ratio visualization (current vs target)
  - Intervention exercise prescriptions
  - Progress logging and milestone tracking
  - Priority-based intervention management
- **PeriodizationOverview**: Visual timeline of training phases and progression
  - Interactive phase timeline with current position marker
  - Adaptation focus distribution charts
  - Periodization model explanations
  - Progression strategy breakdown
- **Enhanced ExerciseListDisplay**: Advanced exercise information and rationale
  - Exercise tier indicators (Tier 1/2/3)
  - Stimulus-to-fatigue ratio visualization
  - Scientific rationale tooltips
  - Weak point targeting labels

### Enhanced User Profiling & Science-Based Training
✅ **Advanced Training Individualization**
- **Volume Parameters**: Training load management based on individual recovery capacity, training age, and stress levels
- **Volume Landmarks (MEV/MAV/MRV)**: Muscle-specific volume guidelines based on exercise science research
  - MEV: Minimum Effective Volume for muscle growth
  - MAV: Maximum Adaptive Volume for optimal gains  
  - MRV: Maximum Recoverable Volume before negative returns
- **Recovery Profile**: Individual fatigue thresholds, recovery rates, and sleep quality assessment
- **Weak Point Analysis**: Strength ratio evaluation and targeted corrective exercise programming
- **RPE Autoregulation**: Rate of Perceived Exertion-based training adjustments
  - Phase-specific RPE targets for different training goals
  - Daily load adjustments based on readiness and fatigue
  - Individual RPE calibration for accurate intensity management
- **Periodization Models**: Support for multiple evidence-based training approaches
  - Linear, Undulating, Block, Conjugate, and Autoregulated periodization
  - Structured phases with specific adaptation targets
  - Systematic deload protocols for recovery optimization
- **Comprehensive TypeScript Interfaces**: Type-safe development with extensive JSDoc documentation
  - Modular design for easy extension and maintenance
  - Integration with AI program generation for enhanced personalization

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

✅ **Pro Tier Advanced Analytics** (New)
- **Volume Progression Dashboard**: Weekly/monthly volume trends by muscle group with density analysis
- **Enhanced PR Tracker**: Multi-rep max calculations, strength velocity trends, and PR prediction algorithms
- **Fatigue & Recovery Analysis**: Muscle group fatigue mapping, recovery time analysis, and training readiness indicators
- **Advanced Data Export**: Raw data export capabilities and progress report generation
- **AI-Powered Insights**: Automated training recommendations based on volume, fatigue, and progression patterns

✅ **Premium Community Features** (New)
- **Pro Badges**: Visual indicators next to usernames for Pro tier subscribers across all community interactions
- **Expert Q&A**: Exclusive content type accessible only to Pro subscribers featuring expert insights and advanced discussions
- **Access Control**: Multi-layer security ensuring Pro content remains exclusive with graceful upgrade prompts
- **Enhanced Community Status**: Distinguished presence for Pro users in community feeds, comments, and interactions

### Subscription Tiers
✅ **Multi-Tier Pricing Model**
- **Trial**: 7-day free trial with full basic features
- **Standard** ($9.99/month): Unlimited AI programs, basic analytics, community access
- **Pro** ($19.99/month): Advanced Analytics dashboard, volume tracking, fatigue analysis, data export, Expert Q&A access, Pro badges
- **Pro Annual** ($159.99/year): All Pro features plus advanced periodization and custom reports
- **Feature Gating**: Pro features protected with upgrade prompts and seamless billing integration

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

CI/CD pipeline setup complete.
<!-- updating dependencies -->

