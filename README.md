# FitnessTracker V2

A modern fitness tracking application built with Next.js, Supabase, and Tailwind CSS.

## Recent Updates

- **Authentication Flow Improvements**: Fixed issues with session persistence and navigation between dashboard and profile pages
- **Dark Theme UI**: Updated entire application with a consistent dark theme for better visual appeal
- **User Avatar Component**: Added personalized user avatars with initials and tooltips for better UX
- **Error Handling**: Improved error handling for database operations to ensure a smoother user experience

## Features

- User authentication with email/password
- Profile management
- Workout tracking
- Progress analytics
- Health app integration

## Design

The application features a modern, minimalist design inspired by high-end fitness applications:

- Dark theme with high contrast
- Full-screen hero sections
- Clean typography with serif headings
- Motivational imagery
- Smooth transitions and animations

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
- Authentication via Supabase
- Form handling with React Hook Form
- Validation with Zod

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE for details
