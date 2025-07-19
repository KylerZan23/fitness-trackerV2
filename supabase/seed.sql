-- Community Seed Data (Robust Version)
-- This file populates the community section with sample data.
-- It now uses subqueries to look up IDs instead of hardcoding UUIDs.

DO $$
DECLARE
    -- Variable to hold the ID of the first user found.
    first_user_id UUID;
BEGIN
    -- Find the ID of the first user to assign as the creator of content.
    -- If no users exist, this will be NULL.
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;

    -- Only proceed with seeding if a user exists.
    IF first_user_id IS NOT NULL THEN
        -- Create sample community groups.
        -- We omit the 'id' column and let the database generate it.
        INSERT INTO public.community_groups (name, description, group_type, created_by)
        VALUES
            ('Powerlifting Crew', 'For those who love the big three: squat, bench, and deadlift. Share your PRs, training tips, and compete on the leaderboard!', 'Powerlifting', first_user_id),
            ('Bodybuilding Hub', 'A place to discuss hypertrophy, nutrition, and aesthetics. Perfect for those focused on muscle building and physique development.', 'Bodybuilding', first_user_id),
            ('CrossFit Warriors', 'High-intensity functional fitness community. Share WODs, discuss technique, and celebrate achievements together.', 'CrossFit', first_user_id),
            ('Running Club', 'For runners of all levels. Share training plans, race experiences, and running tips. From 5K to marathon!', 'Running', first_user_id),
            ('Yoga & Wellness', 'Mind-body connection through yoga, meditation, and holistic wellness practices. Find your inner strength.', 'Wellness', first_user_id)
        ON CONFLICT (name) DO NOTHING; -- Use unique name for conflict resolution

        -- Add the first user to some groups.
        INSERT INTO public.community_group_members (group_id, user_id, role)
        VALUES
            ((SELECT id FROM public.community_groups WHERE name = 'Powerlifting Crew'), first_user_id, 'admin'),
            ((SELECT id FROM public.community_groups WHERE name = 'Bodybuilding Hub'), first_user_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;

        -- Create sample community posts, looking up group_id by name.
        INSERT INTO public.community_posts (user_id, group_id, title, content, tags)
        VALUES
            -- Powerlifting Crew posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Powerlifting Crew'), 'Welcome to the Powerlifting Crew!', 'Hey everyone! Welcome to our powerlifting community.', ARRAY['welcome', 'powerlifting']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Powerlifting Crew'), 'New Deadlift PR - 405 lbs!', 'Finally hit that 4-plate deadlift today!', ARRAY['deadlift', 'PR']),
            -- Bodybuilding Hub posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Bodybuilding Hub'), 'Bodybuilding Hub - Let''s Build Together!', 'Welcome to the Bodybuilding Hub!', ARRAY['bodybuilding', 'welcome']),
            -- Global posts (not tied to any group)
            (first_user_id, NULL, 'My Fitness Journey Begins', 'Just joined this amazing fitness community!', ARRAY['fitness', 'journey']),
            (first_user_id, NULL, 'Tips for Staying Motivated', 'Struggling with motivation lately?', ARRAY['motivation', 'tips'])
        ON CONFLICT DO NOTHING; -- Basic conflict handling for posts

        -- Create some community feed events to make the feed more lively
        INSERT INTO public.community_feed_events (user_id, event_type, metadata)
        VALUES
            (first_user_id, 'WORKOUT_COMPLETED', '{"workout_name": "Upper Body Strength", "duration": "45"}'),
            (first_user_id, 'NEW_PB', '{"exercise": "Deadlift", "weight": "315", "reps": "1"}'),
            (first_user_id, 'STREAK_MILESTONE', '{"streak_days": "30"}')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Seed data populated successfully for user %', first_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users. Skipping seed data population.';
    END IF;
END $$; 