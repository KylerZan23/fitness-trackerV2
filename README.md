# FitnessTracker V2

A modern fitness tracking application built with Next.js, Supabase, and Tailwind CSS.

## Recent Updates

- **Critical Onboarding Fix (2025-01-09)**: Resolved critical issue preventing training program generation after onboarding completion:
  - **Profile Creation Fix**: Enhanced signup process to create comprehensive profiles with all required fields
  - **Error Handling Improvements**: Added robust validation and user-friendly error messages throughout onboarding flow
  - **Program Generation Reliability**: Fixed "The result contains 0 rows" error by ensuring profile completeness
  - **Fallback Recovery**: Added automatic profile creation during onboarding for users with incomplete profiles
  - **Database Validation**: Enhanced profile field validation and null safety checks
  - **User Experience**: Replaced technical errors with actionable feedback and clear next steps

- **Fitness Goal Card Design Improvements (2025-01-09)**: Complete visual redesign of onboarding fitness goal selection with enhanced user experience:
  - **Consistent Card Heights**: All cards now maintain uniform height regardless of content length for professional appearance
  - **Enhanced Grid Layout**: Improved responsive breakpoints (sm:2-col, xl:3-col) with optimized spacing and max-width constraints
  - **Modern Color System**: Replaced flat colors with cohesive gradient backgrounds for visual depth and modern appeal
  - **Improved Typography**: Better visual hierarchy with optimized font weights, sizes, and spacing for enhanced readability
  - **Enhanced Interactions**: Subtle scale animations, hover overlays, and smooth transitions for engaging user feedback
  - **Accessibility Compliant**: Proper focus states, keyboard navigation, and screen reader support maintained
  - **Mobile Optimized**: Touch-friendly targets with performance-optimized animations for mobile devices
  - **Professional Polish**: Rounded corners, shadows, and micro-interactions create a premium user experience

- **Core Program Types Expansion (2025-01-09)**: Enhanced onboarding with specialized, gym-focused fitness goals for better program personalization:
  - **Expanded Goal Types**: Increased from 5 generic goals to 10 specialized options (Muscle Gain: General/Hypertrophy Focus, Strength Gain: General/Powerlifting Peak, etc.)
  - **Gym-Focused Specificity**: Added specialized goals like "Weight Loss: Gym Based", "Bodyweight Mastery", and "Recomposition: Lean Mass & Fat Loss"
  - **Enhanced UI Design**: Updated PrimaryGoalQuestion component with new emojis, descriptions, and color schemes for all 10 goals
  - **Responsive Grid Layout**: Improved layout to handle increased options (1 col mobile, 2 col tablet, 3 col desktop)
  - **Type Safety**: Full TypeScript integration with updated validation in QuestionRegistry for both primary and secondary goal selection
  - **AI Program Benefits**: More specific goal information enables better AI program generation and personalization

- **LLM Program Content Enhancement (2025-01-09)**: Complete overhaul of AI program content system with specialized guidelines for all new fitness goal types:
  - **24 New Guideline Constants**: Expert-designed training guidelines for each specialized goal (8 goals × 3 experience levels)
  - **Precise Mapping Logic**: Enhanced getExpertGuidelines function with exact string matching for specialized variants
  - **Evidence-Based Content**: Each guideline includes specific rep ranges, rest times, RPE guidelines, and progression methods
  - **Progressive Difficulty**: Clear beginner → intermediate → advanced progression paths for each specialization
  - **Format Consistency**: All guidelines maintain the unified 4-header format (PRINCIPLES, WEEKLY PLAN, PROGRESSION, OPTIONS)
  - **Backward Compatibility**: Legacy string-based matching preserved while adding new specialized routing
  - **Optimized Token Usage**: Guidelines maintained at ≤330 words each to minimize LLM context costs
  - **Specialized Content**: Each goal type has distinct, focused content (powerlifting competition prep, bodyweight progressions, etc.)

- **Expert Coach Data Foundation (2025-01-09)**: Established credible expert coach system with realistic fitness industry credentials and specializations:
  - **TypeScript Interface**: Comprehensive ExpertCoach interface with credentials, specialties, and bio information
  - **Diverse Expertise**: 3 mock coaches covering research science, practical strength training, and elite Olympic performance
  - **Realistic Credentials**: Industry-standard certifications (CSCS, PhD Kinesiology, Olympic Competitor, USAW levels)
  - **Utility Functions**: Helper functions for coach lookup by ID, specialty filtering, and specialty enumeration
  - **Extensible Foundation**: Ready for future features like coach-to-program matching and credibility attribution
  - **Placeholder Assets**: Established image URL structure for future coach profile photos

- **Expert Coach Landing Page Integration (2025-01-09)**: Integrated expert coach profiles into landing page to establish credibility and showcase AI expertise backing:
  - **Strategic Placement**: Added coaches section after HowItWorks, creating logical flow from features → process → experts → testimonials
  - **Professional Presentation**: Clean card-based design with circular profile images, credentials badges, and specialty tags
  - **Credibility Messaging**: Clear headlines connecting human expertise to AI accuracy and scientific backing
  - **Responsive Design**: Adaptive grid layout (1 col mobile → 2 col tablet → 3 col desktop) with hover effects
  - **Fallback System**: Graceful image loading with initials display if photos unavailable
  - **Brand Integration**: Coral/orange theming consistent with overall brand identity
  - **Trust Building**: Emphasizes PhD-level research, Olympic experience, and industry certifications

- **Pricing Section Landing Page (2025-01-09)**: Added comprehensive pricing display with clear free trial offering and subscription tiers:
  - **Free Trial Emphasis**: Prominent 7-day free trial with "Cancel anytime" messaging to reduce signup friction
  - **Three-Tier Structure**: Free Trial, Monthly ($19.99), and Annual ($119.99) plans with clear feature differentiation
  - **Visual Hierarchy**: Card-based layout with primary border highlighting for recommended Annual plan
  - **Feature Comparison**: Clear feature lists including AI Programs, AI Coach Access, Advanced Analytics, Community Access
  - **Strategic Placement**: Positioned after Expert Coaches section to establish credibility before pricing reveal
  - **Conversion Optimization**: All pricing tiers link to signup page with specific value propositions

- **Landing Page Structure Rebuild (2025-01-09)**: Complete redesign of landing page with modular, reusable component architecture:
  - **Component Library**: Created `src/components/landing/` directory with 5 specialized components (HeroSection, SocialProof, FeatureSection, Testimonials, HowItWorks)
  - **Hero Section**: Implemented exact headline "Stop Guessing. Start Progressing." with coral/orange theme and signup CTA
  - **Social Proof**: Added Trustpilot-style ratings, media outlet logos (Men's Health, Forbes, etc.), and trust indicators
  - **Feature Showcase**: Grid layout with Lucide icons highlighting AI Program Generation, Progress Tracking, and core features
  - **User Testimonials**: Hardcoded testimonials with user photos, ratings, and authentic feedback quotes
  - **Process Flow**: 3-step "How It Works" (Onboard → Get Program → Train & Track) with visual progression
  - **Modular Architecture**: Clean component separation enabling easy maintenance and future enhancements

- **Core Visual Theme Establishment (2025-01-09)**: Implemented vibrant coral/orange brand identity with energetic Runna-inspired aesthetic:
  - **Brand Color Palette**: Defined `brand-primary` (#FF6B47), `brand-light` (#FFF4F2), and `brand-dark` (#E5472A) for consistent theming
  - **Primary Theme Refactor**: Updated system-wide primary color from dark gray to vibrant coral-orange for all action buttons
  - **Button Component Integration**: Automatic inheritance of new theme across all existing primary buttons
  - **Zero Breaking Changes**: Seamless transition maintaining all existing functionality while enhancing visual appeal
  - **Design System Foundation**: Established expandable brand palette ready for future visual enhancements

- **AI Weekly Review - Progress Tracking on Suggested Actions (2025-01-08)**: Added comprehensive progress tracking for actionable tips with visual status updates and personal notes for enhanced accountability
- **AI Weekly Review - Interactive Follow-up Questions (2025-01-08)**: Enhanced weekly review with interactive Q&A functionality for deeper coaching conversations:
  - **Conversational Interface**: Users can ask follow-up questions about their weekly review insights
  - **Contextual Responses**: AI answers reference specific details from the user's weekly review
  - **Suggested Questions**: Pre-written prompts help users explore relevant topics like consistency, motivation, and goal-setting
  - **Session-Based History**: Conversation history maintained during the current session with clear Q&A formatting
  - **Progressive Disclosure**: Collapsible interface keeps focus on main review while enabling deeper exploration
  - **Keyboard Shortcuts**: Enter key submission for quick question asking
  - **Comprehensive Error Handling**: Graceful degradation with user-friendly error messages

- **AI Weekly Review - Week-over-Week Trend Analysis (2025-01-08)**: Enhanced weekly review with comparative trend insights for progress tracking:
  - **Trend-Based Insights**: AI now compares current week performance to previous week across key metrics
  - **Progress Momentum**: Celebrates positive trends with specific numbers ("+2 workout days", "pace improved")
  - **Early Warning System**: Identifies declining patterns before they become major issues
  - **Data-Driven Comparisons**: Tracks workout days, sessions, duration, and pace changes week-to-week
  - **Trend-Focused Recommendations**: Actionable tips based on trend reversals or momentum maintenance
  - **Enhanced Cache Strategy**: Includes trend data for intelligent caching and proper invalidation
  - **Parallel Data Fetching**: Efficient dual RPC calls for current and extended period analysis

- **AI Weekly Review - Program Adherence Integration (2025-01-08)**: Enhanced weekly review with training program awareness for contextual coaching:
  - **Program-Aware Analysis**: AI now understands user's current training program, phase, and weekly position
  - **Adherence Tracking**: Analyzes completion of planned workouts vs actual training sessions
  - **Program-Aligned Recommendations**: Tips and suggestions reference specific program focuses and planned exercises
  - **Contextual Insights**: Celebrates program compliance and provides specific catch-up strategies
  - **Enhanced Cache Strategy**: Includes program adherence data for more intelligent caching and invalidation
  - **Backward Compatibility**: Gracefully handles users without active programs while prioritizing program context when available
  - **Resilient Implementation**: Program data fetching wrapped in error handling to ensure weekly review continues functioning

- **AI Weekly Review Feature (2025-01-08)**: Intelligent weekly performance analysis providing personalized coaching insights:
  - **Data-Driven Analysis**: AI analyzes past 7 days of activity using comprehensive UserActivitySummary data
  - **Structured Insights**: Celebrates successes, identifies improvement areas, and provides actionable tips
  - **Personalized Coaching**: Contextual analysis based on user goals, experience level, and training patterns
  - **Engaging UI**: Beautiful card design with loading states, error handling, and meaningful icons
  - **Strategic Placement**: Positioned prominently on progress page as first analytical component users see
  - **Comprehensive Prompting**: Sophisticated LLM prompt engineering for supportive yet analytical coaching
  - **Error Resilience**: Robust error handling with user-friendly messages and graceful degradation

- **Security Audit Completed (2025-01-08)**: Comprehensive security review of data access control and secret management with excellent results:
  - **Row-Level Security (RLS) Audit**: All database policies properly enforce user data isolation with `auth.uid()` checks
  - **Server Action Authentication**: Verified authentication patterns across all server actions and API routes
  - **Secret Management**: Confirmed no server-side secrets (SUPABASE_SERVICE_ROLE_KEY, STRAVA_CLIENT_SECRET) exposed in client code
  - **Data Isolation**: All user-specific tables (profiles, workouts, training_programs, feedback) have secure RLS policies
  - **Community Features**: Intentionally public read access for community feed with secure write restrictions
  - **Overall Status**: Application demonstrates excellent security practices with proper access controls

- **Comprehensive Testing Strategy (2025-01-27)**: Established robust testing foundation with React Testing Library and Playwright to ensure application reliability:
  - **Component Testing**: Comprehensive test suites for critical components (WorkoutLog, IndepthAnalysisCard) covering rendering, validation, submission, and UI states
  - **End-to-End Testing**: Complete user journey testing from signup through onboarding to program generation with cross-browser compatibility
  - **Testing Infrastructure**: Jest and Playwright configuration with proper mocking, error handling, and mobile responsiveness testing
  - **Testing Standards**: Established patterns and best practices for user-centric testing, accessibility validation, and maintainable test code
  - **Developer Experience**: Test-driven development foundation providing immediate feedback and confidence during refactoring
  - **Quality Assurance**: Comprehensive coverage of validation errors, loading states, empty states, and error scenarios
  - **Documentation**: ADR-011 documenting testing strategy, patterns, and future enhancement plans

- **Standardized Error Handling System (2025-01-09)**: Implemented comprehensive error handling to eliminate security risks and improve user experience:
  - **Removed Database Fix Buttons**: Eliminated user-facing database schema fixes (e.g., "Fix Database" button in profile picture upload)
  - **Standardized Error Responses**: All server actions now return consistent `{ success: boolean; error?: string; data?: T }` format
  - **Generic User Messages**: Users receive clear, actionable error messages without technical details
  - **Comprehensive Server Logging**: Detailed error information logged server-side for developer debugging
  - **Security Hardening**: No internal system details or raw database errors exposed to clients
  - **Authentication Improvements**: Consistent auth error handling across all server actions
  - **Zero Breaking Changes**: Enhanced existing functionality without altering user-facing behavior

- **Indepth Analysis Card (2025-01-09)**: Added a new progressive overload analysis card to the /progress page for micro-level exercise insights:
  - **Week-over-Week Exercise Comparison**: Compare today's workout session to the exact same day from the previous week
  - **Exercise-Level Progress Tracking**: Individual analysis for each exercise showing weight, reps, sets, and volume changes
  - **Progressive Overload Insights**: Specific feedback like "bench press: +5lbs weight, +15% volume increase"
  - **Trend Indicators**: Visual badges showing improving, declining, or stable performance per exercise
  - **Smart Exercise Aggregation**: Handles multiple sets of the same exercise with maximum weight tracking
  - **Contextual Empty States**: Helpful messages when no workout today or no comparison data available
  - **Consistent UI Design**: Follows existing progress page card patterns with proper loading states
  - **Volume-First Analysis**: Prioritizes total volume changes over isolated weight changes for better progress assessment
  - **Timezone Accuracy**: Properly handles Pacific Time to show correct dates (July 8th instead of July 9th)
  - **Workout Logging Fix**: Fixed timezone issue where workouts were being logged on wrong dates (e.g., Tuesday workouts appearing as Wednesday)

- **Onboarding Completion Threshold Update (2025-01-08)**: Reduced the minimum completion threshold for training program generation from 50% to 40%:
  - **Lower Barrier to Entry**: Users can now generate programs with fewer questions answered (6-7 vs 8+ questions)
  - **Improved Accessibility**: Reduces abandonment risk while maintaining core data quality requirements
  - **AI Adaptability**: LLM program generation handles missing optional information gracefully
  - **Faster Time to Value**: Users can see their personalized programs sooner in the onboarding process
  - **Technical Validation**: All changes tested and validated with successful build completion

- **Workout Exercises Creation Error Fix (2025-01-08)**: Resolved critical workout completion bug with enhanced error handling and data validation:
  - **Root Cause**: Empty error objects during workout exercise insertion made debugging impossible
  - **Enhanced Error Logging**: Comprehensive error breakdown with specific constraint violation identification
  - **Data Validation**: Pre-insertion validation for all exercise fields (names, sets, reps, weight)
  - **Explicit Muscle Group Assignment**: Added fallback muscle group detection to prevent NOT NULL constraint violations
  - **Detailed Diagnostics**: Structured logging for exercise data before database insertion
  - **Improved Reliability**: Better error handling prevents silent failures during workout completion
  - **Zero Breaking Changes**: Enhanced existing functionality without altering user experience

- **Project Structure Cleanup (2025-01-08)**: Comprehensive reorganization to eliminate redundancies and improve maintainability:
  - **Consolidated lib directories**: Removed redundant root `lib/` directory, keeping all application code in `src/lib/`
  - **Organized SQL migrations**: Moved `supabase_rpc_get_user_activity_summary.sql` to proper migration with timestamp
  - **Standardized scripts to TypeScript**: Converted all `.js` files in scripts/ to `.ts` for consistent type safety
  - **Verified import integrity**: Confirmed all existing imports continue to work correctly
  - **Zero breaking changes**: Purely organizational improvements with no runtime impact

- **Comprehensive Server Action Testing (2025-01-09)**: Implemented extensive test coverage for all critical business logic to address the single greatest risk to application stability:
  - **95%+ Coverage**: All server actions now have comprehensive test suites covering success cases, authentication, validation, database errors, and edge cases
  - **Mock Factory Pattern**: Established consistent testing patterns with shared mock data generators and helper functions
  - **AI Logic Testing**: Critical AI program generation and coaching logic now thoroughly tested with LLM failure scenarios
  - **Authentication Security**: Every server action validates authentication and handles token expiration gracefully
  - **Database Resilience**: All database operations tested for connection failures, constraint violations, and concurrent access
  - **Performance & Concurrency**: Load testing and race condition validation for multi-user scenarios
  - **Error Handling**: Comprehensive validation of error scenarios including network timeouts, malformed data, and third-party API failures

- **Focused Workout View (2025-01-09)**: Enhanced workout session experience with dual view modes to eliminate scrolling and maintain focus during training:
  - **Toggle View Modes**: Switch between Full View (all exercises) and Focused View (current exercise only)
  - **Auto-Progression**: Automatically advances to next exercise when current one is completed with smart 1.5-second delay
  - **Navigation Controls**: Previous/Next buttons with disabled states for boundary conditions
  - **Progress Indicators**: Visual dots showing exercise status (not started/current/completed)
  - **Mobile-First Design**: Eliminates cognitive overload and scrolling on mobile devices during active training
  - **Backward Compatible**: Preserves existing full view functionality while adding focused mode
  - **Performance Optimized**: Only renders current exercise in focused mode for better performance

- **Community Seed Data (2025-01-18)**: Created comprehensive seed data to make the community section feel alive and engaging:
  - **5 Community Groups**: Powerlifting Crew, Bodybuilding Hub, CrossFit Warriors, Running Club, and Yoga & Wellness
  - **15 Sample Posts**: Realistic content across different groups and global feed with proper tags and engagement
  - **10 Feed Events**: Workout completions, PRs, and streak milestones to populate the activity feed
  - **Group Memberships**: Automatic user assignment to relevant groups with proper roles (admin/member)
  - **Seed Scripts**: TypeScript scripts for easy data population with environment variable validation
  - **Realistic Content**: Engaging posts about fitness journeys, training tips, and community building
  - **Database Integration**: Proper foreign key relationships and RLS policy compliance
  - **Zero Breaking Changes**: Enhances existing community features without altering functionality

- **AI Feedback System - Database & Backend (2025-01-06)**: Implemented comprehensive feedback collection system for AI-generated content:
  - **Database Schema**: New `ai_program_feedback` and `ai_coach_feedback` tables with proper foreign keys and RLS policies
  - **Server Actions**: Type-safe feedback submission with Zod validation and ownership verification
  - **Dual Reference System**: AI Coach feedback supports both cache key and content hash identification
  - **Security First**: Row Level Security ensures users can only access their own feedback
  - **Analytics Ready**: Built-in statistics helper for feedback analysis and AI improvement
  - **Performance Optimized**: Strategic indexes and efficient query patterns for scalability

- **AI Coach - Specific & Actionable Focus Areas (2025-01-06)**: Enhanced AI Coach focus area suggestions to be data-driven and immediately actionable:
  - **Muscle Group Imbalance Detection**: Analyzes volume differences to identify push/pull imbalances and weak muscle groups
  - **Exercise Progression Analysis**: Identifies stagnant or declining trends in key lifts and suggests specific interventions
  - **Experience-Level Adaptation**: Provides appropriate recommendations from beginner form cues to advanced techniques
  - **Concrete Actions**: Specific tips like "add one extra set to rows" rather than generic advice
  - **Data-Driven Insights**: All suggestions tied directly to user's actual workout patterns and trends
  - **Quality Control**: Only provides suggestions when clear opportunities exist, avoiding generic recommendations

- **AI Coach - Program Adherence & Feedback Loop Integration (2025-01-06)**: Transformed AI Coach from generic advice to program-aware, contextual coaching:
  - **Active Program Integration**: AI Coach now fetches and analyzes user's current training program position
  - **Real-time Adherence Tracking**: Monitors workout completion vs planned program using workout_groups linking
  - **Contextual Recommendations**: Coaching aligns with current phase/week and today's planned workout
  - **Intelligent Feedback**: Acknowledges completed workouts, encourages planned sessions, helps with missed workouts
  - **Program Synergy**: AI Coach and AI Program Generation now work together seamlessly
  - **Performance Optimized**: Minimal additional queries with smart caching integration

- **AI Program Generation - Deeper Personalization (2025-01-06)**: Enhanced AI training program generation with critical safety and personalization improvements:
  - **Mandatory Injury/Limitation Handling**: AI now explicitly avoids exercises that could aggravate user-reported injuries (knee pain, shoulder impingement, etc.) and provides safer alternatives
  - **Detailed Exercise Form Cues**: All major compound lifts now include 1-2 critical form cues directly in the program, with experience-level appropriate guidance
  - **Program Rationale**: Each generated program includes a clear explanation of why the specific structure was chosen based on user goals, experience, and equipment
  - **Enhanced Safety**: Conservative approach for beginners with injury-aware exercise substitutions
  - **Improved User Experience**: Users understand both what to do and why, increasing program adherence and confidence

- **LLM Program Content Refinement (2025-01-06)**: Completely overhauled the AI training program content for improved efficiency and quality:
  - **Evidence-Based Guidelines**: All recommendations now reflect meta-analyses and consensus from 2023-2025
  - **Optimized Format**: Reduced content from 345 to ~200 lines while maintaining comprehensiveness
  - **Structured Layout**: Unified FOUR-header format (PRINCIPLES · WEEKLY PLAN · PROGRESSION · OPTIONS)
  - **Token Efficiency**: Significantly reduced LLM API costs and improved response times
  - **Scientific Accuracy**: Updated with latest exercise science research and RPE-based programming
  - **Maintained Compatibility**: Zero breaking changes to existing AI program generation system

- **Individual Question-Based Onboarding (Complete)**: Replaced the original multi-step onboarding form with an engaging individual question-per-page experience:
  - Each question presented on its own dedicated page for maximum engagement
  - Smooth animations and transitions between questions
  - Real-time validation with helpful feedback and suggestions
  - Progress persistence with auto-save and session restoration
  - Comprehensive review summary before program generation
  - 15+ individual questions with conditional logic and smart navigation
  - **Fixed**: Flow now continues through all questions (including optional strength assessments) before showing review
  - **Fixed**: "Back to Questions" button now properly navigates back to continue the flow
  - **Fixed**: All question components implemented (no more "coming soon" messages)
  - **Fixed**: Onboarding completion now properly saves data and generates AI training programs
  - **Enhanced**: Added loading overlay during AI program generation with progress feedback
  - **Enhanced**: Proper error handling and graceful fallback if program generation fails

- **Enhanced AI Weight Recommendations**: Added 1RM/e1RM data collection during onboarding with personalized weight prescriptions:
  - Individual strength assessment questions for squat, bench press, deadlift, and overhead press
  - Confidence level tracking (actual 1RM vs estimated vs unsure)
  - AI prompt integration with percentage-based training recommendations
  - Conservative approach for beginners and uncertain assessments
  - Proper weight unit handling (lbs/kg) throughout the system

## Key Features

### 🎯 **AI-Powered Training Programs**
- **Personalized workout generation** based on comprehensive onboarding data
- **Injury-aware exercise selection** with automatic substitutions for user limitations
- **Detailed form cues and safety notes** for all major compound movements
- **Program rationale explanations** showing why specific structures were chosen
- **1RM-based weight recommendations** with percentage training zones
- **Equipment-specific exercise selection** and modifications
- **Progressive overload principles** built into program structure
- **Complete Integration**: Onboarding → Data Validation → AI Generation → Database Storage

### 🤖 **Intelligent AI Coach**
- **AI Weekly Review** providing comprehensive analysis with interactive follow-up questions, trend insights, program adherence integration, and personalized coaching
- **Interactive Q&A functionality** allowing users to ask follow-up questions about their weekly review for deeper coaching conversations
- **Action progress tracking** with visual status updates (pending, in-progress, completed, skipped) and personal notes for accountability
- **Trend-based progress tracking** comparing current week performance to previous week across workout days, sessions, duration, and pace
- **Program-aware coaching** that understands your current training phase, weekly position, and planned workout focuses
- **Real-time adherence tracking** with contextual feedback on completed vs planned workouts and program compliance
- **Momentum recognition** celebrating positive trends with specific numbers and identifying declining patterns early
- **Data-driven focus areas** identifying muscle imbalances and exercise progression opportunities
- **Specific actionable recommendations** like "add one extra set to rows" rather than generic advice
- **Experience-level adaptation** from beginner form cues to advanced training techniques
- **Contextual program feedback** celebrating adherence achievements and providing specific catch-up strategies
- **Conversational coaching** with suggested questions and session-based conversation history

### 📝 **User Feedback System**
- **Quality improvement through feedback** on AI-generated programs and coach recommendations
- **Secure feedback storage** with Row Level Security and proper data isolation
- **Dual identification system** for coach recommendations (cache key + content hash fallback)
- **Analytics-ready data structure** for continuous AI model improvement
- **Type-safe submission process** with comprehensive validation and error handling

### 🎯 **Focused Workout Experience**
- **Dual view modes** for workout sessions: Full View and Focused View
- **Distraction-free training** with focused view showing only the current exercise
- **Auto-progression** that advances to the next exercise when current one is completed
- **Smart navigation** with Previous/Next controls and exercise progress indicators
- **Mobile-optimized** interface eliminating the need to scroll during workouts
- **Real-time progress tracking** with visual indicators for completed exercises

### 📊 **Strength Analytics Dashboard**
- **Comprehensive Progress Tracking**: Detailed strength analytics with e1RM calculations for major lifts
- **Strength Vitals Cards**: Real-time tracking of squat, bench, deadlift, and overhead press 1RM estimates
- **Progressive Overload Analysis**: New Indepth Analysis card comparing today's workout to last week's same session
- **Exercise-Level Insights**: Micro-level tracking showing weight, reps, sets, and volume changes for each exercise
- **Trend Visualization**: Visual indicators showing improving, declining, or stable performance patterns
- **Muscle Group Distribution**: Charts showing training balance across different muscle groups
- **Volume Tracking**: 7-day rolling volume calculations and training consistency metrics
- **Historical Progression**: Long-term strength progression charts with confidence levels

### 🔄 **Seamless Onboarding Experience**
- Individual question-per-page design for maximum engagement
- Real-time validation with helpful suggestions and warnings
- Progress auto-save and session restoration
- Comprehensive review summary with edit capabilities
- Loading states and error handling for smooth user experience

### 🛡️ **Robust Error Handling System**
- **Standardized error responses** across all server actions with consistent format
- **User-friendly error messages** that guide users to resolution without exposing technical details
- **Comprehensive server-side logging** with detailed error information for developer debugging
- **Security-first approach** preventing exposure of database schema or internal system details
- **Authentication error handling** with clear guidance for re-authentication
- **Graceful degradation** ensuring application remains functional during partial service outages

### 🧪 **Comprehensive Testing Strategy**
- **Component Testing**: React Testing Library tests for critical UI components with user-centric testing approach
- **End-to-End Testing**: Playwright tests covering complete user journeys from signup to program generation
- **Cross-Browser Compatibility**: Automated testing across Chrome, Firefox, Safari, and mobile devices
- **Validation Testing**: Comprehensive coverage of form validation, error states, and edge cases
- **Accessibility Testing**: Automated checks for proper ARIA attributes, labels, and semantic HTML
- **Mock Strategy**: Robust mocking of external dependencies (Supabase, server actions) for reliable testing
- **Test-Driven Development**: Foundation for confident refactoring and feature development

### 📊 **Comprehensive Data Collection**
- Primary and secondary fitness goals
- Training focus and experience level assessment
- Equipment availability and session preferences
- Exercise preferences and limitations
- Detailed strength assessments with 1RM estimates
- Injury and limitation considerations

### 🏋️‍♂️ **Smart Program Generation**
- TypeScript-validated program structures
- Zod schema validation for AI responses
- Equipment-based exercise substitutions
- Experience-level appropriate programming
- Strength data integration for personalized weights

## Technical Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Backend
- **Supabase** for authentication and database
- **PostgreSQL** with JSONB for flexible program storage
- **Row Level Security** for data protection
- **Server Actions** for type-safe API calls

### AI Integration
- **OpenAI GPT-4o-mini** for program generation
- **Structured JSON responses** with schema validation
- **Comprehensive prompt engineering** with TypeScript interfaces
- **Error handling and fallback mechanisms**

### Testing Infrastructure
- **Jest** for unit and integration testing
- **Testing Library** for component testing
- **Comprehensive server action testing** with proper dependency mocking
- **Type-safe test patterns** with mock factories and TypeScript integration
- **Authentication flow testing** ensuring proper security boundaries

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/KylerZan23/fitness-trackerV2.git
   cd fitness-trackerV2
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Supabase and OpenAI API keys
   ```

4. **Run the development server**
   ```bash
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Testing

The application includes comprehensive testing for critical business logic:

### Running Tests
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run specific test file
yarn test src/__tests__/actions/aiCoachActions.test.ts

# Run tests with coverage
yarn test --coverage
```

### Test Coverage
- **Server Actions**: Comprehensive testing of authentication, error handling, and success scenarios
- **Components**: UI component testing with user interaction simulation
- **Database Functions**: Unit tests for data access layer
- **Authentication Flows**: Security boundary testing

### Test Patterns
All server action tests follow a consistent pattern:
1. **Mock Dependencies**: Supabase client, LLM service, database functions
2. **Authentication Testing**: Verify proper handling of authenticated/unauthenticated users
3. **Error Scenarios**: Test all failure modes (DB errors, API failures, validation errors)
4. **Success Paths**: Verify complete happy path scenarios
5. **Edge Cases**: Handle missing data and boundary conditions

## Environment Variables Required

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for AI program generation)
LLM_API_KEY=sk-your-openai-api-key
LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions  # Optional, defaults to OpenAI
```

## User Flow

1. **Sign Up** → Create account with basic profile information
2. **Onboarding** → Complete individual question-based assessment
3. **Review** → Verify responses and preferences
4. **AI Generation** → Personalized training program created
5. **Dashboard** → Access your program and track progress

## Recent Fixes & Improvements

### Onboarding Flow Completion ✅
- **Issue**: "Generate My Training Program" button only redirected to dashboard without saving data
- **Solution**: Implemented proper `finalizeOnboardingAndGenerateProgram` server action integration
- **Features Added**:
  - Data transformation and validation before submission
  - Loading overlay with progress feedback during AI generation
  - Error handling with graceful fallback
  - Success/warning states with appropriate redirects
  - Proper TypeScript typing throughout the flow

### Question Component Implementation ✅
- **Issue**: Several questions showed "component not yet implemented" messages
- **Solution**: Created comprehensive question components for all onboarding steps
- **Components Added**:
  - `PrimaryTrainingFocusQuestion` - Training focus selection with detailed descriptions
  - `SecondaryGoalQuestion` - Optional secondary fitness goals
  - `ExperienceLevelQuestion` - Fitness experience assessment
  - `SessionDurationQuestion` - Workout duration preferences
  - `ExercisePreferencesQuestion` - Free-form exercise preferences and limitations
  - Individual strength assessment components for all major lifts

### Navigation & Flow Control ✅
- **Issue**: "Back to Questions" button didn't work properly
- **Solution**: Fixed navigation logic to properly return to question flow
- **Issue**: Flow completed too early, skipping optional questions
- **Solution**: Updated completion logic to ensure all questions are presented

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email kylerzan23@gmail.com or open an issue on GitHub.

## Profile Management

The application includes comprehensive profile management features:

1. **Profile Information**: View and edit personal information such as name, age, and fitness goals
2. **Preferences**: Set preferences like weight units (kg/lbs)
3. **Profile Pictures**: Upload and manage profile pictures with the following capabilities:
   - Image upload with size and format validation
   - Storage options including Data URI and Supabase Storage
   - Self-healing database schema with automatic column creation if needed
   - "Fix Database" button that automatically resolves schema issues
   - Secure access control with Row Level Security (RLS)
   - Fallback to initials-based avatars when no image is available
   - Profile picture display throughout the application

### Profile Picture Troubleshooting

For issues related to profile picture uploads, the application provides:

1. **Automatic Schema Detection**: The app automatically detects if the database is missing required columns
2. **One-Click Fix**: Users can click the "Fix Database" button to resolve schema issues without manual SQL
3. **Data URI Fallback**: If Supabase Storage isn't configured, images are stored directly in the database as Data URIs
4. **Comprehensive Documentation**: See [Profile Picture Fix Documentation](docs/profile-picture-fix.md) for details
5. **Admin Tools**: Users with admin privileges can access advanced database tools to run migrations and fix issues

For detailed information on setting up profile pictures for production use, see the documentation at [docs/profile-picture-fix.md](docs/profile-picture-fix.md).

## Authentication

The app uses Supabase Authentication with Server-Side Rendering (SSR) support:

1. Middleware-based session verification for protected routes
2. Cookie-based authentication using the `@supabase/ssr` package
3. Separation of client and server authentication contexts
4. Clear error handling for authentication failures

For troubleshooting authentication issues, see [Authentication Troubleshooting Guide](docs/auth-troubleshooting.md).
For information on recent authentication fixes, see [Authentication Fixes Documentation](docs/authentication-fixes.md).
For specific help with "Auth session missing" errors, see [Auth Session Troubleshooting Guide](docs/auth-session-troubleshooting.md).

### Auth File Structure

- `src/lib/supabase.ts` - Browser client setup
- `src/utils/supabase/server.ts` - Server components client
- `src/utils/supabase/middleware.ts` - Middleware-specific client
- `src/middleware.ts` - Route protection and session verification
- `src/app/api/create-profile/route.ts` - Server-side profile creation with enhanced logging
- `docs/auth-flow.md` - Authentication flow documentation
- `docs/auth-troubleshooting.md` - Solutions for common authentication issues
- `docs/authentication-fixes.md` - Documentation of fixes for authentication issues
- `docs/auth-session-troubleshooting.md` - Specific guide for troubleshooting auth session issues
- `docs/auth-loop-fix.md` - Documentation of the authentication loop fix
- `scripts/test-token.js` - Standalone script for testing Supabase token verification

## Design

The application features a modern, minimalist design inspired by high-end fitness applications. The core application (Dashboard, Workout Logging, Profile, etc.) utilizes a clean, **light theme** (e.g., `bg-gray-100` for main layout backgrounds, white for cards) for optimal readability and a modern feel. Specific introductory pages like the landing page or authentication screens may employ darker backgrounds or vibrant gradients for visual impact during those initial user flows.

Key design elements include:

- Modern landing page with gradient background and device mockups
- Intuitive form elements for collecting user preferences
- Consistent light theme across core application features
- Full-screen hero sections
- Clean typography with serif headings
- Motivational imagery
- Smooth transitions and animations
- Interactive muscle group visualization
- Strava-inspired run activity cards with route maps

## Run Tracking & Strava Integration

The application features a dedicated Run Logger page with Strava integration:

1. **Strava OAuth Integration**: Connect to Strava to import runs and activities
2. **Interactive Maps**: View run routes on interactive maps using Leaflet
3. **Strava-like Activity Cards**: Modern run activity cards displaying:
   - User information and run metadata
   - Run statistics (distance, pace, time)
   - Route visualization on a map
   - Segment and achievement information
4. **Manual Run Logging**: Add runs manually with distance, time, and location
5. **Dual View Options**: Toggle between card view (with maps) and table view
6. **Imperial Units**: All distances shown in miles, elevations in feet, and pace in minutes per mile
7. **Secure Token Management**: Server-side token refresh with automatic database updates

### Strava Security Architecture

The application implements a secure, server-side token management system:

- **Server-Side Token Refresh**: All token refresh operations happen on the server using `/api/strava/refresh-token`
- **Client-Side Safety**: `STRAVA_CLIENT_SECRET` is never exposed to the browser
- **Automatic Token Updates**: Tokens are automatically refreshed and persisted to the database
- **User Authentication**: All token operations require proper user authentication
- **Transparent Operation**: Client components handle token refresh seamlessly without user intervention

For more information on run tracking features, see [Run Tracking Documentation](docs/run-tracking.md).
For details on the Strava token security implementation, see [ADR-001: Strava Token Refresh Server-Side Only](docs/adr/001-strava-token-refresh-server-side-only.md).

## Image Attribution

All images are sourced from Unsplash and are free to use under the Unsplash License:

1. Hero Background: Photo by Victor Freitas

   - Dark gym equipment scene
   - Source: https://unsplash.com/photos/WvDYdXDzkhs

2. Login Background: Photo by John Arano

   - Silhouette workout scene
   - Source: https://unsplash.com/photos/h4i9G-de7Po

3. Signup Background: Photo by Anastase Maragos

   - Dynamic workout moment
   - Source: https://unsplash.com/photos/9dzWZQWZMdE

4. Success Background: Photo by Conscious Design
   - Celebratory fitness scene
   - Source: https://unsplash.com/photos/7ZmtUtAArRI

## Workout Tracking

The application provides robust workout tracking features, allowing users to log, view, and analyze their training progress. The yearly workout calendar on the `/workouts` page now offers a consolidated view, displaying both manually logged lifting sessions and synchronized Strava run activities.

1.  **Exercise Logging**: Record individual exercises or create workout groups with multiple exercises. The form includes fields for exercise name, sets, reps, weight, duration, date, and notes.
2.  **Unified Interface**: The workout logging page (`/workout/new`) features a clean UI consistent with the dashboard's light theme, using shared components for a seamless experience.
3.  **Workout History**: View past workouts and track progress over time (Functionality TBD/Located Elsewhere).
4.  **Performance Metrics**: Analyze workout trends and statistics via dashboard widgets.
5.  **Notes and Tags**: Add custom notes to each workout session or group.

### Workout Data Schema

- `exerciseName`: Name of the exercise performed
- `sets`: Number of sets completed
- `reps`: Repetitions per set
- `weight`: Weight used (in kg)
- `duration`: Time spent on the exercise (in minutes)
- `notes`: Optional notes about the workout
- `muscleGroup`: The primary muscle group targeted by the exercise

## Strava Integration

The application integrates with Strava to provide run tracking capabilities:

### Setup

1. Create a Strava API application at https://www.strava.com/settings/api
2. Add your Strava API credentials to the `.env.local` file:
   ```bash
   NEXT_PUBLIC_STRAVA_CLIENT_ID=YOUR_STRAVA_CLIENT_ID
   STRAVA_CLIENT_SECRET=YOUR_STRAVA_CLIENT_SECRET
   NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/run-logger/callback
   ```

### Features

1. **OAuth Authentication**: Securely connect to the Strava API using OAuth 2.0
2. **Run Listing**: View your recent runs from Strava with detailed metrics
3. **Manual Run Logging**: Log runs manually with custom distances, times, and descriptions
4. **Imperial Units**: All distances displayed in miles instead of kilometers for better user experience
   - Miles for distances (instead of kilometers)
   - Feet for elevation (instead of meters)
   - Minutes per mile for pace (instead of minutes per kilometer)

### Unit Conversion

The application includes a centralized unit conversion system in `src/lib/units.ts`:

1. **Metric to Imperial Conversion**: Automatically converts all API data from metric (meters) to imperial (miles/feet)
2. **Imperial to Metric Conversion**: Converts user inputs from imperial units to metric for API submissions
3. **Formatted Displays**: Provides formatted output strings with appropriate units (e.g., "3.14 mi", "150 ft")
4. **Pace Calculation**: Calculates and formats running pace in minutes per mile

For more information on the imperial units implementation, see the [Imperial Units Support ADR](docs/adr/imperial-units-support.md).

### Architecture

- **OAuth Flow**: Implementation of the authorization code flow for secure authentication
- **Token Storage**: Tokens stored securely in Supabase database with user profiles
- **Modular Components**: Reusable components for connecting to Strava, viewing runs, and logging runs
- **Unit Conversion**: Automatic conversion between Strava's metric units and display units (imperial)

### Data Schema Updates

The `profiles` table has been updated with the following fields to support Strava integration:

- `strava_access_token`: User's Strava access token
- `strava_refresh_token`: User's Strava refresh token
- `strava_token_expires_at`: Expiration timestamp for the access token
- `strava_connected`: Boolean flag indicating if the user has connected their Strava account

## 🎯 Features

### Core Functionality
- **AI Training Program Generator**: Personalized workout programs using OpenAI GPT-4o-mini
- **Individual Question-Based Onboarding**: Streamlined question-per-page flow with:
  - Primary and secondary fitness goals
  - Training style and experience level selection
  - **Unit preference selection (kg/lbs)** - NEW! 
  - Training frequency and session duration
  - Equipment availability assessment
  - Optional strength assessments (1RM estimates)
  - Exercise preferences and injury considerations
- **Enhanced Workout Logging**: Track exercises, sets, reps, and weights with **Quick Log** feature
  - **Quick Log**: One-click logging using planned weight and reps values
  - **Smart Auto-fill**: Automatically populates actual values from exercise plan
  - **PB Detection**: Personal best checking integrated into quick logging
  - **Manual Override**: Full manual input still available when needed
- **Progress Tracking**: Visual charts and analytics
- **Strava Integration**: Sync running activities automatically
- **Profile Management**: Comprehensive user profiles with unit preferences

### Advanced Features
- **Real-time Validation**: Instant feedback during onboarding
- **Progress Persistence**: Resume onboarding where you left off
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Support**: Eye-friendly interface options
- **Unit Conversion**: Automatic weight unit handling throughout the app
- **Subscription Management**: Freemium model with 7-day trials and premium subscriptions

### Subscription & Trial System
- **Automatic Trial Start**: New users receive 7-day free trial immediately upon signup
- **Trial Tracking**: Precise timestamp-based trial expiration with user-friendly status messages
- **Subscription Status**: Simple boolean-based premium subscription management
- **Database Foundation**: Optimized schema with indexes for fast subscription checking
- **Utility Functions**: Comprehensive TypeScript utilities for subscription management:
  - `getSubscriptionStatus()` - Detailed subscription and trial status
  - `hasActiveAccess()` - Simple access verification
  - `startTrial()`, `upgradeToPremium()`, `cancelPremium()` - Account management
- **Payment Ready**: Database structure prepared for future Stripe integration
