# FitnessTracker V2

A modern fitness tracking application built with Next.js, Supabase, and Tailwind CSS.

## Recent Updates

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
- Personalized workout generation based on comprehensive onboarding data
- 1RM-based weight recommendations with percentage training zones
- Equipment-specific exercise selection and modifications
- Progressive overload principles built into program structure
- **Complete Integration**: Onboarding → Data Validation → AI Generation → Database Storage

### 🔄 **Seamless Onboarding Experience**
- Individual question-per-page design for maximum engagement
- Real-time validation with helpful suggestions and warnings
- Progress auto-save and session restoration
- Comprehensive review summary with edit capabilities
- Loading states and error handling for smooth user experience

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
- **Workout Logging**: Track exercises, sets, reps, and weights
- **Progress Tracking**: Visual charts and analytics
- **Strava Integration**: Sync running activities automatically
- **Profile Management**: Comprehensive user profiles with unit preferences

### Advanced Features
- **Real-time Validation**: Instant feedback during onboarding
- **Progress Persistence**: Resume onboarding where you left off
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Support**: Eye-friendly interface options
- **Unit Conversion**: Automatic weight unit handling throughout the app
