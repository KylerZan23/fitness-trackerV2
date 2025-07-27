# NeuralLift - AI-Powered Fitness Tracker

A comprehensive fitness tracking application powered by Next.js and Supabase, featuring AI-driven program generation, community features, and real-time progress tracking.

## Recent Updates

### Profile Enhancement & Personal Records Editing (Latest)
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

## License

MIT License - see LICENSE file for details

---

**NeuralLift** - Transforming fitness through intelligent technology
