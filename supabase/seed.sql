-- Community Seed Data
-- This file populates the community section with sample data to make it feel alive and engaging

-- Create sample community groups
INSERT INTO public.community_groups (id, name, description, group_type, created_by)
VALUES
    ('8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a', 'Powerlifting Crew', 'For those who love the big three: squat, bench, and deadlift. Share your PRs, training tips, and compete on the leaderboard!', 'Powerlifting', (SELECT id FROM auth.users LIMIT 1)),
    ('c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b', 'Bodybuilding Hub', 'A place to discuss hypertrophy, nutrition, and aesthetics. Perfect for those focused on muscle building and physique development.', 'Bodybuilding', (SELECT id FROM auth.users LIMIT 1)),
    ('d7b2c4e6-9e4a-4b0a-8b1e-3f9e8d389e4c', 'CrossFit Warriors', 'High-intensity functional fitness community. Share WODs, discuss technique, and celebrate achievements together.', 'CrossFit', (SELECT id FROM auth.users LIMIT 1)),
    ('e9f1a3b5-9e4a-4b0a-8b1e-3f9e8d389e4d', 'Running Club', 'For runners of all levels. Share training plans, race experiences, and running tips. From 5K to marathon!', 'Running', (SELECT id FROM auth.users LIMIT 1)),
    ('f2g4h6i8-9e4a-4b0a-8b1e-3f9e8d389e4e', 'Yoga & Wellness', 'Mind-body connection through yoga, meditation, and holistic wellness practices. Find your inner strength.', 'Wellness', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Add some users to groups (assuming we have existing users)
-- Note: This will only work if there are existing users in auth.users
DO $$
DECLARE
    user_id UUID;
    group_ids UUID[] := ARRAY[
        '8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a',
        'c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b',
        'd7b2c4e6-9e4a-4b0a-8b1e-3f9e8d389e4c',
        'e9f1a3b5-9e4a-4b0a-8b1e-3f9e8d389e4d',
        'f2g4h6i8-9e4a-4b0a-8b1e-3f9e8d389e4e'
    ];
BEGIN
    -- Get the first user (if any exist)
    SELECT id INTO user_id FROM auth.users LIMIT 1;
    
    -- If we have a user, add them to some groups
    IF user_id IS NOT NULL THEN
        -- Add user to Powerlifting and Bodybuilding groups
        INSERT INTO public.community_group_members (group_id, user_id, role)
        VALUES 
            ('8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a', user_id, 'admin'),
            ('c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b', user_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
END $$;

-- Create sample community posts
INSERT INTO public.community_posts (user_id, group_id, title, content, tags)
VALUES
    -- Powerlifting Crew posts
    ((SELECT id FROM auth.users LIMIT 1), '8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a', 'Welcome to the Powerlifting Crew!', 'Hey everyone! Welcome to our powerlifting community. This is the place to share your latest PRs, training tips, and get advice from fellow lifters. Whether you''re just starting out or you''re a seasoned competitor, we''re here to support each other on our strength journey. Let''s see those big lifts! 💪', ARRAY['welcome', 'powerlifting', 'community']),
    
    ((SELECT id FROM auth.users LIMIT 1), '8f2e8d38-9e4a-4b0a-8b1e-3f9e8d389e4a', 'New Deadlift PR - 405 lbs!', 'Finally hit that 4-plate deadlift today! Been working towards this goal for months. The key for me was focusing on proper form and gradually increasing volume. What''s everyone else working towards?', ARRAY['deadlift', 'PR', 'strength']),
    
    -- Bodybuilding Hub posts
    ((SELECT id FROM auth.users LIMIT 1), 'c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b', 'Bodybuilding Hub - Let''s Build Together!', 'Welcome to the Bodybuilding Hub! This is your space to discuss everything hypertrophy-related: training splits, nutrition, supplements, and progress photos. Remember, we''re all on our own journey - let''s support and motivate each other!', ARRAY['bodybuilding', 'hypertrophy', 'welcome']),
    
    ((SELECT id FROM auth.users LIMIT 1), 'c5a9f3b1-9e4a-4b0a-8b1e-3f9e8d389e4b', 'My 12-Week Transformation Journey', 'Just completed my first 12-week bodybuilding program and I''m amazed at the results! Gained 8 pounds of muscle while staying lean. The key was consistency in both training and nutrition. Happy to share my routine if anyone is interested!', ARRAY['transformation', 'progress', 'bodybuilding']),
    
    -- CrossFit Warriors posts
    ((SELECT id FROM auth.users LIMIT 1), 'd7b2c4e6-9e4a-4b0a-8b1e-3f9e8d389e4c', 'CrossFit Warriors - Ready to Sweat!', 'Welcome to the CrossFit Warriors! This is where we share WODs, discuss technique, and celebrate our achievements. Whether you''re a CrossFit veteran or just getting started, you belong here. Let''s get after it! 🔥', ARRAY['crossfit', 'welcome', 'community']),
    
    ((SELECT id FROM auth.users LIMIT 1), 'd7b2c4e6-9e4a-4b0a-8b1e-3f9e8d389e4c', 'Today''s WOD - Murph Prep', 'Getting ready for Murph! Today''s workout focused on building endurance and strength. Anyone else preparing for this classic? Share your training strategies!', ARRAY['wod', 'murph', 'crossfit']),
    
    -- Running Club posts
    ((SELECT id FROM auth.users LIMIT 1), 'e9f1a3b5-9e4a-4b0a-8b1e-3f9e8d389e4d', 'Running Club - Let''s Hit the Pavement!', 'Welcome to the Running Club! Whether you''re training for your first 5K or preparing for an ultramarathon, this is your community. Share your routes, training plans, and race experiences. Let''s run together! 🏃‍♂️', ARRAY['running', 'community', 'welcome']),
    
    ((SELECT id FROM auth.users LIMIT 1), 'e9f1a3b5-9e4a-4b0a-8b1e-3f9e8d389e4d', 'First Marathon Completed!', 'Just finished my first marathon in 3:45! The training was tough but so worth it. The support from this community kept me going during those long training runs. Thank you everyone!', ARRAY['marathon', 'achievement', 'running']),
    
    -- Yoga & Wellness posts
    ((SELECT id FROM auth.users LIMIT 1), 'f2g4h6i8-9e4a-4b0a-8b1e-3f9e8d389e4e', 'Yoga & Wellness - Find Your Balance', 'Welcome to our yoga and wellness community! This is a space for mindfulness, meditation, and holistic health practices. Let''s support each other in finding balance between strength and serenity. Namaste 🙏', ARRAY['yoga', 'wellness', 'mindfulness']),
    
    ((SELECT id FROM auth.users LIMIT 1), 'f2g4h6i8-9e4a-4b0a-8b1e-3f9e8d389e4e', 'Morning Meditation Routine', 'Started a 30-day morning meditation challenge and it''s been life-changing! Just 10 minutes a day has improved my focus and reduced stress significantly. Anyone else practicing meditation?', ARRAY['meditation', 'wellness', 'routine']),
    
    -- Global posts (not tied to any group)
    ((SELECT id FROM auth.users LIMIT 1), NULL, 'My Fitness Journey Begins', 'Just joined this amazing fitness community! Excited to connect with like-minded people and share our fitness journeys. Here''s to getting stronger, healthier, and supporting each other along the way! 💪', ARRAY['fitness', 'journey', 'community']),
    
    ((SELECT id FROM auth.users LIMIT 1), NULL, 'Tips for Staying Motivated', 'Struggling with motivation lately? Here are my top 3 tips: 1) Set small, achievable goals, 2) Find a workout buddy, 3) Track your progress. What keeps you motivated?', ARRAY['motivation', 'tips', 'fitness']),
    
    ((SELECT id FROM auth.users LIMIT 1), NULL, 'Nutrition Question - Meal Prep Ideas', 'Looking for some meal prep inspiration! What are your go-to healthy meals that are easy to prepare in bulk? Trying to stay on track with my nutrition goals.', ARRAY['nutrition', 'meal-prep', 'healthy-eating']),
    
    ((SELECT id FROM auth.users LIMIT 1), NULL, 'Workout Music Recommendations', 'Need some new workout music to keep me pumped! What are your favorite songs or playlists for different types of workouts? Always looking for new energy boosters!', ARRAY['music', 'workout', 'motivation']),
    
    ((SELECT id FROM auth.users LIMIT 1), NULL, 'Recovery Day Activities', 'What do you all do on recovery days? I''m trying to find the right balance between rest and active recovery. Any favorite stretching routines or low-impact activities?', ARRAY['recovery', 'rest', 'stretching'])
ON CONFLICT DO NOTHING;

-- Create some community feed events to make the feed more lively
INSERT INTO public.community_feed_events (user_id, event_type, metadata)
VALUES
    ((SELECT id FROM auth.users LIMIT 1), 'WORKOUT_COMPLETED', '{"workout_name": "Upper Body Strength", "duration": "45", "exercises": ["Bench Press", "Overhead Press", "Rows"]}'),
    ((SELECT id FROM auth.users LIMIT 1), 'NEW_PB', '{"exercise": "Deadlift", "weight": "315", "reps": "1", "previous_best": "295"}'),
    ((SELECT id FROM auth.users LIMIT 1), 'STREAK_MILESTONE', '{"streak_days": "30", "milestone": "30 Day Streak"}'),
    ((SELECT id FROM auth.users LIMIT 1), 'WORKOUT_COMPLETED', '{"workout_name": "Leg Day", "duration": "60", "exercises": ["Squats", "Lunges", "Calf Raises"]}'),
    ((SELECT id FROM auth.users LIMIT 1), 'NEW_PB', '{"exercise": "Bench Press", "weight": "225", "reps": "1", "previous_best": "205"}'),
    ((SELECT id FROM auth.users LIMIT 1), 'STREAK_MILESTONE', '{"streak_days": "7", "milestone": "Week 1 Complete"}'),
    ((SELECT id FROM auth.users LIMIT 1), 'WORKOUT_COMPLETED', '{"workout_name": "Cardio Session", "duration": "30", "exercises": ["Running", "HIIT"]}'),
    ((SELECT id FROM auth.users LIMIT 1), 'NEW_PB', '{"exercise": "Squat", "weight": "275", "reps": "1", "previous_best": "255"}'),
    ((SELECT id FROM auth.users LIMIT 1), 'STREAK_MILESTONE', '{"streak_days": "14", "milestone": "2 Week Streak"}'),
    ((SELECT id FROM auth.users LIMIT 1), 'WORKOUT_COMPLETED', '{"workout_name": "Full Body Circuit", "duration": "40", "exercises": ["Push-ups", "Pull-ups", "Burpees"]}')
ON CONFLICT DO NOTHING;

-- Add a comment for documentation
COMMENT ON TABLE community_groups IS 'Sample community groups created for demonstration purposes';
COMMENT ON TABLE community_posts IS 'Sample posts to populate the community with engaging content';
COMMENT ON TABLE community_feed_events IS 'Sample feed events to make the community feel alive'; 