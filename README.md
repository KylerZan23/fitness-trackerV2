# FitnessTracker V2

A modern fitness tracking application built with Next.js, Supabase, and Tailwind CSS.

## Recent Updates

- **Simplified Signup Flow**: Implemented minimal account creation that collects only essential information (name, email, password) and immediately redirects users to the comprehensive onboarding questionnaire, ensuring all users complete their profile setup while reducing initial signup friction.
- **AI Training Program Generator**: Implemented complete AI-powered training program generation with comprehensive onboarding questionnaire, LLM integration (OpenAI GPT-4o-mini), and personalized program creation based on user goals, equipment, and experience level.
- **Comprehensive Onboarding Flow**: Added multi-step onboarding questionnaire collecting fitness goals, training preferences, equipment access, and limitations with seamless integration to AI program generation.
- **Training Program Database Schema**: Created robust database schema for storing AI-generated training programs with JSONB storage, automatic field extraction, and Row Level Security.
- **Dashboard "Log New Workout" Button**: Re-implemented a prominent "Log a New Workout" button on the dashboard page for easy access to workout logging.
- **Workout Calendar Enhancement**: The yearly workout history calendar on the `/workouts` page now displays both Strava run activities and traditional lifting workouts, providing a unified view of all training.
- **Workout Logging UI Overhaul**: Redesigned the workout logging page (`/workout/new`) to match the dashboard's light theme and layout for a consistent user experience.
- **CoPacer-Inspired Landing Page**: Updated the landing page with a modern gradient background, simplified form inputs, and device mockup visuals
- **Dashboard Running Activity**: Added a "Your Recent Run" section to the dashboard to display the latest run from Strava
- **Strava-like Run Cards**: Added Strava-style run cards with map visualization to the run logger page
- **Fixed Authentication Loop**: Added force_login parameter to bypass authentication checks and allow direct access to login page
- **Enhanced Authentication Security**: Updated middleware to use `getUser()` instead of `getSession()` for secure token verification
- **Fixed Workout Logging**: Resolved schema cache issue that prevented workout logging by removing dependency on muscle_group column
- **Simplified Workout Entry**: Removed the exercise selector component for a more direct workout logging experience -> Updated to reflect UI overhaul.
- **Simplified Exercise Selection**: Removed muscle group filtering during workout entry for a more streamlined workout logging experience -> Updated to reflect UI overhaul.
- **Enhanced Auth Session Debugging**: Added comprehensive client and server-side logging for authentication troubleshooting and a standalone token verification testing tool
- **Improved Auth Token Verification**: Enhanced security by using service role for token verification with proper error handling
- **Enhanced Authentication & Profile Creation**: Fixed RLS policy issues and improved server-side API token verification for robust user registration
- **Improved Authentication Flow**: Added ability to bypass authentication redirection for accessing the login page and switching accounts
- **Muscle Group Information**: Added muscle group information for exercises when logging workouts
- **Workout Entry Feature**: Added a new page for logging individual workouts with exercise details
- **SSR Authentication Fix**: Updated Supabase client to use cookie-based authentication for SSR compatibility, fixing login redirection issues
- **Authentication Flow Improvements**: Fixed issues with session persistence and navigation between dashboard and profile pages

- **User Avatar Component**: Added personalized user avatars with initials and tooltips for better UX
- **Error Handling**: Improved error handling for database operations to ensure a smoother user experience
- **Added Run Logger Page**: New dedicated page for tracking running activities accessible from the dashboard
- **Strava API Integration**: Added Strava OAuth authentication and run logging capabilities to the Run Logger page
- **Imperial Unit Support**: Updated run logging and display to use miles, feet, and miles-per-minute metrics instead of kilometers
- **Profile Picture Upload**: Added support for uploading and displaying user profile pictures with Supabase Storage integration
- **Unified Workout Calendar**: The yearly workout calendar on the `/workouts` page now includes Strava run data alongside lifting workouts, offering a comprehensive training overview.

## Features

- **AI Training Program Generator**: Complete LLM-powered personalized training program creation with:
  - Multi-step onboarding questionnaire (9 comprehensive questions)
  - OpenAI GPT-4o-mini integration with structured JSON responses
  - Equipment-based exercise selection and progressive overload
  - Zod schema validation for type-safe program generation
  - Automatic database persistence and program management
- User authentication with email/password (SSR-compatible)
- Profile management
- Workout tracking with detailed exercise logging (integrated into the light-themed dashboard layout)
- Progress analytics
- Health app integration
- Exercise categorization
- Muscle heatmap visualization for tracking training balance
- Run tracking with Strava integration and interactive maps
- **Dashboard UI:** A modern, sidebar-based dashboard with a **light theme**, displaying:
  - Welcome banner (e.g., "Welcome back, {user}").
  - Today's Snapshot: Displays "Exercises", "Sets", "Total Duration (min)", and "Total Weight".
  - Workout trends chart (last 7 days).
  - Muscle group distribution chart.
  - Goals tracking section (e.g., weekly distance, workout days).
  - Recent activity section (e.g., runs).
  - AI Personal Coach section.
  - Prominent "Log a New Workout" button for quick access to logging.

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

For more information on run tracking features, see [Run Tracking Documentation](docs/run-tracking.md).

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

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   yarn install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Then add your Supabase credentials to `.env.local`

4. Start the development server:

   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Development

- Built with Next.js 14 (App Router)
- Styled with Tailwind CSS
- Authentication via Supabase SSR
- Form handling with React Hook Form
- Validation with Zod
- Map visualization with Leaflet

## Code Quality

This project uses ESLint and Prettier to maintain code quality and consistent styling:

### Linting

- ESLint is configured with TypeScript-specific rules
- Run linting checks:
  ```bash
  yarn lint
  ```
- Fix automatically fixable issues:
  ```bash
  yarn lint:fix
  ```

### Formatting

- Prettier ensures consistent code formatting
- Format all files:
  ```bash
  yarn format
  ```
- Check if files are properly formatted:
  ```bash
  yarn format:check
  ```

### Pre-commit Hooks

Consider adding pre-commit hooks with Husky to ensure code quality before committing:

```bash
yarn add --dev husky lint-staged
```

Then add to package.json:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE for details

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
