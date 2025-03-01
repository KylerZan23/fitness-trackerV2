# FitnessTracker V2

A modern fitness tracking application built with Next.js, Supabase, and Tailwind CSS.

## Recent Updates

- **Improved Authentication Flow**: Added ability to bypass authentication redirection for accessing the login page and switching accounts
- **Integrated Muscle Heatmap**: Muscle heatmap visualization now directly integrated into the workout page for a more cohesive experience
- **Muscle Group Filtering**: Added muscle group selector for filtering exercises when logging workouts
- **Muscle Heatmap Visualization**: Added visualization to track workout intensity across different muscle groups
- **Workout Entry Feature**: Added a new page for logging individual workouts with exercise details
- **SSR Authentication Fix**: Updated Supabase client to use cookie-based authentication for SSR compatibility, fixing login redirection issues
- **Authentication Flow Improvements**: Fixed issues with session persistence and navigation between dashboard and profile pages
- **Dark Theme UI**: Updated entire application with a consistent dark theme for better visual appeal
- **User Avatar Component**: Added personalized user avatars with initials and tooltips for better UX
- **Error Handling**: Improved error handling for database operations to ensure a smoother user experience

## Features

- User authentication with email/password (SSR-compatible)
- Profile management
- Workout tracking with detailed exercise logging
- Progress analytics
- Health app integration
- Exercise categorization
- Muscle heatmap visualization for tracking training balance

## Authentication

The app uses Supabase Authentication with Server-Side Rendering (SSR) support:

1. Middleware-based session verification for protected routes
2. Cookie-based authentication using the `@supabase/ssr` package
3. Separation of client and server authentication contexts
4. Clear error handling for authentication failures

For troubleshooting authentication issues, see [Authentication Troubleshooting Guide](docs/auth-troubleshooting.md).

### Auth File Structure

- `src/lib/supabase.ts` - Browser client setup
- `src/utils/supabase/server.ts` - Server components client
- `src/utils/supabase/middleware.ts` - Middleware-specific client
- `src/middleware.ts` - Route protection and session verification
- `docs/auth-flow.md` - Authentication flow documentation
- `docs/auth-troubleshooting.md` - Solutions for common authentication issues

## Design

The application features a modern, minimalist design inspired by high-end fitness applications:

- Dark theme with high contrast
- Full-screen hero sections
- Clean typography with serif headings
- Motivational imagery
- Smooth transitions and animations
- Interactive muscle group visualization

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

The application includes comprehensive workout tracking capabilities:

1. **Exercise Logging**: Record individual exercises with sets, reps, weight, and duration
2. **Workout History**: View past workouts and track progress over time
3. **Performance Metrics**: Analyze workout trends and statistics
4. **Notes and Tags**: Add custom notes to each workout session
5. **Muscle Heatmap**: Visualize which muscle groups you've trained and identify imbalances

### Workout Data Schema

- `exerciseName`: Name of the exercise performed
- `sets`: Number of sets completed
- `reps`: Repetitions per set
- `weight`: Weight used (in kg)
- `duration`: Time spent on the exercise (in minutes)
- `notes`: Optional notes about the workout
- `muscleGroup`: The primary muscle group targeted by the exercise
