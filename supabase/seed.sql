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
            ('Yoga & Wellness', 'Mind-body connection through yoga, meditation, and holistic wellness practices. Find your inner strength.', 'Wellness', first_user_id),
            -- Phase 1 Expansion: Core New Communities
            ('Olympic Weightlifting', 'Master the snatch and clean & jerk. Technical discussions, form checks, and competition prep for Olympic lifting athletes.', 'Olympic Lifting', first_user_id),
            ('Strongman Training', 'Atlas stones, tire flips, and farmer walks! Functional strength training with unconventional implements and strongman events.', 'Strongman', first_user_id),
            ('Calisthenics Masters', 'Bodyweight mastery and skill development. From basic pull-ups to advanced human flags and muscle-ups.', 'Calisthenics', first_user_id),
            ('Cycling Enthusiasts', 'Road warriors, mountain bikers, and indoor cycling fanatics. Share routes, training plans, and gear recommendations.', 'Cycling', first_user_id),
            ('Boxing & Combat Sports', 'Sweet science and martial arts training. Boxing, MMA, kickboxing technique, conditioning, and fight preparation.', 'Combat Sports', first_user_id),
            ('Nutrition & Meal Prep', 'Fuel your fitness with proper nutrition. Meal planning, recipe sharing, supplement discussions, and diet strategies.', 'Nutrition', first_user_id),
            ('Women''s Fitness', 'Female-focused fitness community. Strength training, hormonal health, pregnancy fitness, and empowering women in fitness.', 'Women''s Health', first_user_id),
            ('Senior Fitness', 'Staying strong and active at any age. Age-appropriate training, mobility work, and fitness for the 50+ community.', 'Senior Health', first_user_id)
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
            -- Olympic Weightlifting posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Olympic Weightlifting'), 'Snatch Technique Breakdown', 'Let''s discuss proper snatch form and common mistakes. First pull is crucial!', ARRAY['snatch', 'technique']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Olympic Weightlifting'), 'Competition Prep Tips', 'Preparing for my first local competition. Any advice from experienced lifters?', ARRAY['competition', 'advice']),
            -- Strongman Training posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Strongman Training'), 'DIY Atlas Stone Tutorial', 'Made my own atlas stones at home! Here''s how to build them cheap and effective.', ARRAY['atlas-stone', 'DIY', 'equipment']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Strongman Training'), 'Farmer''s Walk PR!', 'Just hit a 150lb per hand farmer''s walk for 100 feet! Grip strength is everything.', ARRAY['farmers-walk', 'PR', 'grip']),
            -- Calisthenics posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Calisthenics Masters'), 'First Muscle-Up Achievement!', 'After 6 months of training, I finally got my first clean muscle-up! Here''s my progression.', ARRAY['muscle-up', 'progression', 'achievement']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Calisthenics Masters'), 'Handstand Daily Practice', 'Daily handstand practice routine. Consistency beats intensity every time!', ARRAY['handstand', 'practice', 'routine']),
            -- Cycling posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Cycling Enthusiasts'), 'Best Local Cycling Routes', 'Sharing my favorite local routes with elevation profiles and scenic stops!', ARRAY['routes', 'cycling', 'local']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Cycling Enthusiasts'), 'Century Ride Training Plan', 'Training for my first 100-mile ride. 12-week plan with progressive mileage buildup.', ARRAY['century', 'training', 'endurance']),
            -- Boxing & Combat Sports posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Boxing & Combat Sports'), 'Heavy Bag Workout Routine', 'My go-to heavy bag routine for conditioning and technique practice. 20 minutes of intensity!', ARRAY['heavy-bag', 'routine', 'conditioning']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Boxing & Combat Sports'), 'Sparring Safety Tips', 'First time sparring can be intimidating. Here are essential safety tips for beginners.', ARRAY['sparring', 'safety', 'beginners']),
            -- Nutrition posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Nutrition & Meal Prep'), 'High-Protein Meal Prep Ideas', 'Sunday meal prep with 40g protein per serving. Easy, tasty, and macro-friendly recipes!', ARRAY['meal-prep', 'protein', 'recipes']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Nutrition & Meal Prep'), 'Pre-Workout Nutrition Guide', 'What to eat before training for optimal performance. Timing and macros matter!', ARRAY['pre-workout', 'nutrition', 'performance']),
            -- Women''s Fitness posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Women''s Fitness'), 'Strength Training Myths Debunked', 'Lifting heavy won''t make you bulky! Let''s bust common myths about women and strength training.', ARRAY['strength-training', 'myths', 'education']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Women''s Fitness'), 'Training During Menstrual Cycle', 'How to optimize training around your cycle. Understanding hormonal fluctuations for better results.', ARRAY['menstrual-cycle', 'hormones', 'training']),
            -- Senior Fitness posts
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Senior Fitness'), 'Joint-Friendly Exercises', 'Low-impact exercises that are easy on the joints but still build strength and mobility.', ARRAY['low-impact', 'joints', 'mobility']),
            (first_user_id, (SELECT id FROM public.community_groups WHERE name = 'Senior Fitness'), 'Starting Fitness at 60+', 'It''s never too late to start! My journey beginning strength training in my 60s.', ARRAY['beginners', 'inspiration', 'over-60']),
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