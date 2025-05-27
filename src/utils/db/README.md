# Database Setup Instructions

This directory contains the SQL schema for the FitnessTracker application. Follow these steps to set up your Supabase database correctly.

## Setting Up Your Database Schema

1. **Open Supabase Dashboard**:

   - Go to [app.supabase.com](https://app.supabase.com/)
   - Navigate to your project

2. **Access SQL Editor**:

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Schema SQL**:
   - Copy the contents of `schema.sql` file
   - Paste into the SQL query editor
   - Click "Run" to execute

## Schema Details

The schema defines two main tables:

1. **profiles** - Stores user profile information

   - Linked to Supabase auth users
   - Contains name, email, age, fitness goals

2. **workouts** - Stores workout data
   - Linked to user accounts
   - Contains exercise name, sets, reps, weight, duration, notes
   - Has Row Level Security to ensure users can only access their own data

## Common Issues

If you're encountering errors with workout logging, check these common issues:

1. **Missing Tables**: Make sure you've run the SQL setup script
2. **RLS Policies**: Ensure Row Level Security policies are properly configured
3. **Permission Issues**: Check that your user has the correct permissions
4. **Database Structure**: Verify the table structure matches what the application expects

## Testing Your Setup

After setting up the schema, you can run a quick test query:

```sql
SELECT * FROM workouts LIMIT 5;
```

If successful, your database is set up correctly!

## Schema Updates

If the schema changes, look for migration files in this directory that need to be run to update your database structure.
