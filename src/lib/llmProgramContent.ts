// src/lib/llmProgramContent.ts

// This file will store condensed training guidelines extracted from an expert document.
// Each constant represents guidelines for a specific fitness goal and experience level.

// --- MUSCLE GAIN (BODYBUILDING FOCUS) ---
export const MUSCLE_GAIN_BEGINNER_GUIDELINES = `
Primary Goal: Muscle Gain (Hypertrophy).
Experience Level: Beginner.
Principles: Emphasize moderate-weight, higher-volume resistance training to induce muscle fatigue and growth. Typically split by muscle groups (e.g., push, pull, legs) for full-body coverage. Rest periods are kept fairly short (60-90s) to maximize metabolic stress. Adequate nutrition, especially protein, is essential for recovery.
Weekly Plan (3 days/week, full-body):
    • Day 1 - Full Body: Squat (3×8–10), Bench Press (3×8–10), Bent-Over Row (3×8–10). Rest ~60–90 seconds. Accessory moves (e.g., biceps curls, triceps dips) for 2×10-12 each.
    • Day 2 - Rest or Light Cardio: Recovery.
    • Day 3 - Full Body: Deadlift (3×5–8), Overhead Press (3×8), Lat Pulldown or Pull-Up (3×8-10). Rest ~1-2 minutes (heavy sets). Add core exercise (planks) at the end.
    • Day 4 - Rest: Emphasize good nutrition and sleep.
    • Day 5 - Full Body: Leg Press (3×10), Dumbbell Bench Press (3×10), Dumbbell Row (3×10), plus Lunges and Shoulder Raises (2×12 each) for smaller muscles.
    • Days 6-7 - Rest or Active Recovery: Light activity (walking, stretching).
Progression: Beginners progress quickly. Gradually increase weight or reps (progressive overload). Rule of thumb: if you can perform 2 more reps than the target for an exercise in two consecutive sessions, increase the load (~5-10%) next time. Focus on mastering exercise form first, then add volume or intensity. Linear progression (simply adding weight/reps each week) works well. No complex periodization is needed. Ensure recovery weeks (deload) as needed if fatigue builds up (cut volume ~50%).
Adaptations:
    • Frequency: 2 days/week: Use full-body workouts. 4 days/week: Switch to an upper/lower split (each muscle group 2x/week).
    • Session Duration: 30 min: Reduce exercises, superset movements, focus on big compound lifts. 60+ min: Include more isolation exercises and longer rests, but be cautious of diminishing returns.
    • Equipment:
        • Full gym: Use barbells and machines for progressive resistance.
        • Dumbbells only: Substitute barbell exercises with dumbbell variants (dumbbell presses, goblet squats), aim for 6-12 rep range at a challenging load.
        • Bodyweight only: Focus on difficult variations (push-ups, pull-ups, single-leg squats) and high reps near fatigue (sets to near-failure). Absolute muscle gain may be slower.
`;

export const MUSCLE_GAIN_INTERMEDIATE_GUIDELINES = `
Primary Goal: Muscle Gain (Hypertrophy).
Experience Level: Intermediate.
Principles: Can handle more volume and often follow a split routine to specialize on certain muscle groups. Sufficient volume (approximately 10-20 total sets per muscle weekly) is targeted. Repetition ranges remain mostly 6-12 reps (67-85% 1RM) for hypertrophy, with some exercises for smaller muscles going higher (12-15 reps). Multiple sets per exercise are used to maximize muscle fiber recruitment.
Weekly Plan (4-5 days/week, muscle group split):
    • Day 1 - Upper Body (Push Focus): Bench Press (4×8), Incline Dumbbell Press (3×10), Shoulder Press (3×10), Triceps Pushdown (3×12). Rest ~1–2 min on big lifts.
    • Day 2 - Lower Body: Back Squat (4×8), Romanian Deadlift (3×10), Leg Press (3×12), Hamstring Curl (3×15), Calf Raise (3×15). Short rest (~1 min on smaller moves, 2 min on heavy squats).
    • Day 3 - Rest or Active Recovery: Light cardio or mobility work.
    • Day 4 - Upper Body (Pull Focus): Barbell Row (4×8), Pull-Ups (3× AMAP), Seated Cable Row (3×10), Biceps Curls (3×12), Face Pulls (2×15).
    • Day 5 - Lower Body (Quad Focus): Front Squat or Leg Press (3×10), Walking Lunges (3×12 each leg), Leg Extension (3×15), Core exercise (e.g., hanging leg raises 3×12).
    • Day 6 - Rest: Recovery.
    • Day 7 - Optional Accessory Day: If energy allows – e.g., Shoulder isolation and extra arm work (3×10-15 for various raises, curls, etc.), or simply rest.
Progression: Progress slower than novices and benefit from more structured periodization. Rather than adding weight every session, an intermediate might progress weekly or in multi-week cycles. A simple approach is linear periodization over a few months: e.g., spend 4-6 weeks increasing volume (sets/reps) at moderate weight, then 4-6 weeks increasing intensity (heavier weight lower reps), then a deload week. Progressive overload remains key: continue to add load or reps each week if possible, or increase training density by shortening rest. Introduce planned deloads every ~6-8 weeks of hard training (light week with ~50% volume).
Adaptations:
    • Frequency: Common minimum 4 days/week. 5-6 days: Extra days for specialization (e.g., weak point training) or added cardio/active recovery. Ensure ~48 hours before re-training a muscle. 3 days/week: Full-body or upper/lower/full split, may need to limit total sets per session.
    • Session Duration: 45-60 min: Stick to 4-5 main exercises. 30 min: Agonist-antagonist superset format or prioritize big lifts. 90+ min: Include more isolation work and longer rest, but avoid excessive fatigue.
    • Equipment:
        • Full gym: Use a wide variety of machines and cables in addition to free weights to target muscles from different angles.
        • Basic equipment (dumbbells, resistance bands): Dumbbell presses, rows, squats/lunges. Increase reps if weights are lighter, go to near-muscle-failure. Use unilateral moves.
        • Bodyweight only: Increase volume (more sets/reps), decrease rest, incorporate advanced moves (pistol squats, elevated feet push-ups). Slow down tempo (eccentric phase). Hypertrophy can be achieved with a wide range of loads as long as sets are taken close to failure.
`;

export const MUSCLE_GAIN_ADVANCED_GUIDELINES = `
Primary Goal: Muscle Gain (Hypertrophy).
Experience Level: Advanced.
Principles: Often train 5+ days per week, allowing each muscle group its own focused session for maximum volume (e.g., ~15-25 sets per muscle group weekly). Use multiple exercises (4–6+) per muscle group, hitting different angles and rep ranges. Reps generally cluster in 6-12 range for most sets, with some heavy low-rep work (5-6 reps) for strength, and very high-rep burnouts (15-20 reps) for endurance. Intensity techniques (drop sets, rest-pause, supersets) are sometimes used sparingly.
Weekly Plan (5-6 days/week, specialized split):
    • Day 1 – Chest: Bench Press (5×6–8 heavy), Incline Dumbbell Press (4×8-10), Chest Fly (3×12), Cable Crossovers (3×15), maybe push-up finishers.
    • Day 2 – Back: Barbell Row (e.g., 4x8), Pull-Ups (e.g., 3xAMAP), Seated Cable Row (e.g., 3x10), Face Pulls (e.g., 2x15), additional back isolation.
    • Day 3 – Shoulders: Overhead Press (e.g., 3x8), Lateral Raises (e.g., 3x12), Front Raises (e.g., 3x12), Rear Delt Flyes (e.g., 2x15).
    • Day 4 – Legs: Back Squat (5×6), Leg Press (4×10), Romanian Deadlift (4×8), Leg Curl (3×12), Leg Extension (3×15), Calf Raises (4×15).
    • Day 5 – Arms: Biceps Curls (e.g., 3x12), Hammer Curls (e.g., 3x12), Triceps Pushdowns (e.g., 3x15), Overhead Extensions (e.g., 3x15).
    • Day 6 – Rest (or repeat weak muscle group).
    • Day 7 – Rest.
Progression: Requires more sophisticated progression and periodization models since linear gains stall. Progress planned in mesocycles (blocks of a few weeks) focused on specific goals. Block periodization: focus on higher volume (muscle size) followed by higher intensity (strength). Many programs undulate volume and intensity weekly (e.g., Week 1 high volume moderate load, Week 2 moderate volume higher load, Week 3 highest volume lower load, Week 4 deload). Deloading becomes critical every 4-8 weeks (greatly reduced training stress, ~50% volume). Progress gauged in smaller increments (e.g., 2.5 kg/month, or one extra rep). Assistive strategies like training periodization (DUP, varying rep schemes) are used. Pay close attention to recovery (nutrition, sleep, massage).
Adaptations:
    • Frequency: With 5-6 days/week, usually each muscle is trained once (or sometimes twice) per week at high volume. Fewer days (e.g., 4 days): Push/Pull/Legs/Upper split, longer sessions. Higher frequency (e.g., 6 days) allows more focus but demands excellent recovery management.
    • Session Duration: Often 60-90 minutes training a single muscle group. Time limited (<45 min): Employ supersets or giant sets to achieve volume faster (may increase intensity of effort, necessitate lighter weights). Abundant time: Two-a-day sessions to distribute training stress and maximize quality.
    • Equipment:
        • Full gym: Highly beneficial (machines, cables, varying equipment) for diversity of stimulus and maximal growth.
        • Limited equipment: Cycle creative strategies (resistance bands for end-ranges, one-arm/one-leg variations, heavy bodyweight exercises like hundreds of push-ups). Truthfully, absolute muscle gain will be somewhat limited without heavy external load. Focus shifts to muscle endurance and maintenance. Principles of tension, volume, progression apply; push close to failure (6-15 rep range), creative overload.
`;

// --- STRENGTH GAIN (POWERLIFTING FOCUS) ---
export const STRENGTH_GAIN_BEGINNER_GUIDELINES = `
Primary Goal: Maximize muscular strength and neural efficiency (ability to lift heavy loads).
Experience Level: Beginner.
Principles: Emphasize high intensity (heavy weight), lower-rep sets, and longer rests (2-3+ min) for full recovery between efforts. Form and technique are crucial. Accessory exercises strengthen weak links but do not overshadow core lifts.
Weekly Plan (3 days/week, full-body strength):
    • Day 1: Back Squat (3×5 reps), Bench Press (3×5), Bent-Over Row (3×6-8). Heavy sets (~5 reps build strength, ~85% of 1RM). Rest ~2-3 minutes. Add a lightweight accessory: e.g., 2×10 back extensions.
    • Day 2: Rest or light cardio/mobility.
    • Day 3: Deadlift (1×5 one top set, very taxing), Overhead Press (3×5), Pull-Up or Lat Pulldown (3×8 if bodyweight pull-ups are too hard, do 3 sets to near-failure). Optional 2×15 crunches for core. Long rests (3+ min) before the next heavy set.
    • Day 4: Rest.
    • Day 5: Squat (3×5), Bench Press (3×5), Barbell Row (3×6-8) (repeat Day 1's pattern). If bench was done on Day 1, some programs alternate bench and overhead press.
    • Days 6-7: Rest (or light activity). Next week, repeat similar rotation, slightly increasing weight on each lift if last week's sets were completed.
Intensity: Most sets 3-6 rep range, heavy loads (80-90% of 1RM). Volume: moderate (e.g., 3×5). Assistance lifts: higher reps (6-10).
Progression: Novice lifters increase strength rapidly (the "novice effect"). Add weight every session (~2.5 kg to squat). Use small increments. When no longer adding weight each session, switch to weekly progression (intermediate stage). Periodization is minimal (linear overload). Basic autoregulation: light day/extra rest if fatigued or form breaks. No formal deload weeks initially, but deload if plateau or overtraining (4-5 days lighter training). The 2-for-2 rule for progression.
Adaptations:
    • Frequency: 2 days/week: Full-body (more exercises per day). 4 days/week: Upper/lower split (careful fatigue management).
    • Session Duration: 30 min: Focus on 1-2 main lifts. 60+ min: More warm-up sets/accessory work.
    • Equipment:
        • Full gym: Barbells, power rack ideal.
        • Dumbbells only: Limited but doable. Goblet/split squats, dumbbell bench presses, one-arm rows. Max strength harder to develop with lighter equipment, rep range may creep up (5-8 reps). Focus on maximal effort.
        • Bodyweight only: Emphasize progression by increasing movement difficulty (e.g., knee push-ups to standard to feet-elevated). Add reps. True 1RM gains limited without heavy external loads. Incorporate explosive moves (clap push-ups, jump squats) for neural recruitment. Key: Use maximum resistance available for low reps.
`;

export const STRENGTH_GAIN_INTERMEDIATE_GUIDELINES = `
Primary Goal: Maximize muscular strength and neural efficiency.
Experience Level: Intermediate.
Principles: Often adopt a 4-day split for more focus and recovery. Common setup: two upper-body days and two lower-body days per week, often arranged as Heavy/Light or Volume/Intensity variants. Rep scheme emphasizes low reps for core lifts (1-6 reps), eventually working in the 1-5 rep max range for peak sets. Assistance exercises: moderate reps (6-12) to build supporting muscle mass. Total training frequency usually 3-4 days/week.
Weekly Plan (4 days/week, Upper/Lower split):
    • Day 1 - Upper Body (Heavy): Bench Press (5×5 at ~80-85% 1RM), Overhead Press (3×6), Barbell Row (4×6), Weighted Pull-Ups (3×5). Finish with 2×10 biceps curls or triceps extensions. Rest ~2-3 min.
    • Day 2 - Lower Body (Heavy): Back Squat (5×5 at ~80-85% 1RM), Deadlift (3×5 or Deadlift 1×5 heavy and 2×5 lighter back-off sets), Walking Lunges (3×8 each leg), maybe 3×10 hanging leg raises. Long rests (3+ min) especially between squat/deadlift sets.
    • Day 3 - Rest or light conditioning.
    • Day 4 - Upper Body (Light/Volume): Bench Press (3×8 at ~70% 1RM, focusing on speed/technique), Overhead Press (3×8), Bent-over Row or Lat Pulldown (3×10), optional accessory high-rep triceps/shoulder work (e.g., face pulls 2×15). Light day reinforces form and builds muscle without overstressing CNS.
    • Day 5 - Lower Body (Light/Volume): Front Squat or Squat (3×8 at ~70% 1RM), Romanian Deadlift (3×8), Leg Press (3×10), Glute Ham Raise/Hamstring Curl (3×10–15). Possibly farmer's carries or calf raises.
    • Days 6-7: Rest or ancillary training (mobility, sport-specific drills).
Progression: Cannot increase weights every session; progress week-to-week. Simple model: weekly linear progression (e.g., 5×5 squats at 100 kg Week1, 102.5 kg Week2) until plateau. Periodization important: planned variations in volume and intensity over weeks. Undulating periodization (alternating heavy/lighter sessions within week) or block periodization (hypertrophy then strength) common. Progressive overload central: lift more weight/do extra rep each week on main lifts. Occasional reset/deload when progress stalls. Deloading every 4-6 weeks common (weight drop ~10-20% for a week or cutting sets in half). Learn to cycle intensity (wave loads). Progression about managing stress and recovery.
Adaptations:
    • Frequency: 3 days/week: 3-day full-body (cycle heavy focus on different lifts daily). 4 days allows more focus/volume. 5 strength days typically for high-level peaking. Most intermediates thrive on 3-4 days intense lifting.
    • Session Duration: Typical 60-90 min. 45 min: Reduce accessory exercises, focus on main lifts and 1-2 key accessories. Quality over quantity. Longer sessions: maintain intensity, more warm-up/mobility. Avoid marathon sessions.
    • Equipment:
        • Full gym: Barbells, rack essential.
        • Dumbbells only: Heavy dumbbell versions of big lifts (goblet/split squats, one-arm presses/rows). Heavy dumbbells (80-100+ lb) needed to truly challenge strength. May build muscular endurance more than max strength.
        • Bodyweight only: Advanced calisthenics (one-arm pull-ups/push-ups, pistol squats) to approximate intensity. Can increase relative strength, but absolute strength gains limited. Investment in load/gym recommended for max strength. Use maximal resistance available for low reps.
`;

export const STRENGTH_GAIN_ADVANCED_GUIDELINES = `
Primary Goal: Maximize muscular strength and neural efficiency.
Experience Level: Advanced.
Principles: Follow highly individualized, specialized periodized programs. Often train 4-5+ days/week with separate days devoted to specific lifts or qualities. Key features: specific lift emphasis each day, generally lower rep ranges (peak sets of 1-5 reps for core lifts at 80-95% 1RM), and heavy integration of periodization. Train in cycles targeting distinct qualities.
Weekly Plan (4-5+ days/week, specialized periodized program): Example 5-day layout:
    • Day 1 - Squat Focus: Squat (work up to a top set of 3 reps near 3RM), then 3 back-off sets of 5 at ~85%. Follow with complementary lifts: Paused Squats (3×3), Leg Press (3×10), core work.
    • Day 2 - Bench Focus: Bench Press (e.g., 5/3/1 wave: week1 5×5, week2 5×3, week3 5×1 heavy singles, then deload), plus accessory: Close-Grip Bench (4×6), Dumbbell Incline Press (3×8), Rows (4×8), arm work.
    • Day 3 - Rest or active recovery: Light cardio or technique drills.
    • Day 4 - Deadlift Focus: Deadlift (5×3 heavy triples), Block Pulls or Deficit Deadlifts (3×5), Barbell Hip Thrusts (3×8), Hamstring Curls (3×12). Long rests ~3 min on main sets.
    • Day 5 - Overhead/Bench Volume: Overhead Press (4×6), Bench Press (3×8 at ~70% speed/technique), Chin-Ups (4×8), Shoulder raises and triceps extensions (3×12 each).
    • Day 6 - Conditioning or Explosive Training: Sprints, prowler pushes, jumps to maintain explosiveness without heavy load.
    • Day 7 - Rest.
Progression: Non-linear; improvements happen in spurts, requires planned overload with adequate deload. Goals set for training cycles (e.g., 5-10 kg 1RM squat increase in 3 months). Periodization models (DUP, weekly undulating, block periodization) manipulate training stress. Block periodization (volume block then intensity block) common, ending with taper/deload. Planned deload weeks more regular (every 3rd-4th week, or larger deload after full training block). Auto-regulation crucial (RPE-guided, adjust loads). Progress measured in small increments, sometimes waves. Progressive overload applied cyclically long-term. Train accessory lifts in varying rep ranges. Progression is strategic planning, pushing limits in cycles, incorporating recovery, peaking.
Adaptations:
    • Frequency: Most train 4-5 days/week. Some 6 days (upper/lower alternating 6-day, 3x/week per muscle). Bulgarian approach (squat daily) requires special conditions. Optimal frequency is individual. ACSM suggests 4-5 days/week. Reduced frequency (3 days): Consolidate work, long sessions. Increased frequency (6 days): Reduced session volume.
    • Session Duration: Long sessions (heavy lifts 2 hours). Coaches often keep sessions ~90 min using multiple sessions. If time limited, pair complementary work (speed before fatigue, strength before conditioning). Short sessions: maintenance, quick heavy lift for neural stimulus. Partial workouts better than skipping.
    • Equipment:
        • Full gym: Barbells, racks, benches mandatory. Specialized equipment (belts, chalk, shoes, bands/chains, velocity-based tools, force plates).
        • Limited equipment: Maintain strength with heavy dumbbells (if 80-100+ lb), advanced calisthenics (one-arm pull-ups/push-ups, pistol squats). Max strength gains limited without barbell. Focus shifts to strength-endurance/maintenance.
        • Bodyweight only: Maintenance mode. Explosive movements (sprints, jumps) to keep neural drive. Absolute strength will likely detrain. Equipment constraints force goal redefinition. Use maximal resistance at hand (weighted vest, feet-elevated push-ups).
`;

// --- ENDURANCE IMPROVEMENT (ENDURANCE FOCUS) ---
export const ENDURANCE_IMPROVEMENT_BEGINNER_GUIDELINES = `
Primary Goal: Cardiorespiratory Endurance (Ability to sustain aerobic exercise for extended periods) and muscular endurance.
Experience Level: Beginner.
Principles: Focus on aerobic endurance activities (running, cycling, swimming, rowing). Key components: frequency of aerobic sessions, intensity management (easy vs. hard days), gradual progression of volume (distance or duration). Gains primarily from increasing duration and intensity of cardiovascular workouts. Resistance training beneficial for economy and injury resistance.
Weekly Plan (3 days aerobic training + cross-training): About 3 days/week aerobic exercise, with rest or light activity on other days. Focus on increasing duration of continuous exercise at a moderate pace.
    • Day 1 - Moderate Cardio: Jog or brisk walk for 20-30 minutes (easy to moderate pace, able to converse). Cycling/swimming 20+ min comfortable effort. Goal: build aerobic base.
    • Day 2 - Rest or Cross-Training: Light activity (e.g., yoga, stretching, easy bike ride) for recovery.
    • Day 3 - Cardio + Strength Combo: 15 minutes of cardio (rowing machine or jog) followed by a full-body bodyweight circuit (e.g., 2-3 rounds of 10 squats, 10 push-ups, 15 sit-ups, 10 lunges, 30s plank). Improves muscular endurance and general fitness.
    • Day 4 - Rest: Or very light activity (short walk).
    • Day 5 - Long Slow Distance (LSD): One relatively longer session at low intensity (e.g., 3 miles at easy pace, 30-45 min continuous). Trains endurance by pushing duration boundary.
    • Day 6 - Rest or cross-train: Easy swim/cycle for 20-30 minutes.
    • Day 7 - Rest. Total: ~3 cardio-focused days (2 shorter, 1 longer) plus maybe 1 mixed/cross day.
Progression: Gradually increase volume (duration/distance) while managing intensity. The 10% rule: increase weekly mileage/time by no more than ~10%. E.g., add 5 minutes per run per week or extend the long run by about 1 km/5 min each week. Add an extra training day once base fitness allows. Prioritize consistency. Can introduce gentle interval training (e.g., 2-3 short faster pickups 30s). Initial phase: increasing duration (6-8 weeks base building), then improvement phase: one workout a week becomes higher intensity. Include "recovery weeks" every 3-4 weeks (dial back volume 50-70%). Overall: do a bit more over time (longer or faster).
Adaptations:
    • Frequency: 2 days/week: Longer sessions, include variety (run + bike). Slower progress, but significant gains possible. 5-6 days/week: Ensure most are easy efforts (1 long, 1 faster interval, rest easy/recovery). At least 1 rest day.
    • Session Duration: 20-30 min: Focus on higher-intensity workouts (HIIT, tempo runs). 60+ min: Ideal for building endurance, increase length slowly.
    • Equipment:
        • Minimal: Running shoes, bicycle, pool access.
        • No cardio machines/outdoors: Step-ups, jump rope, dance/aerobic videos, sports (soccer). Bodyweight circuits (jumping jacks, burpees, mountain climbers) can improve aerobic fitness, especially with intervals.
        • Specific equipment (treadmill, stationary bike): Tailor plan, use incline/resistance.
        • Incorporate flexibility/mobility work (stretching after workouts).
`;

export const ENDURANCE_IMPROVEMENT_INTERMEDIATE_GUIDELINES = `
Primary Goal: Cardiorespiratory Endurance (Sustained Aerobic Exercise).
Experience Level: Intermediate.
Principles: Increase training frequency and introduce structured workouts of varying intensity. Incorporate high-intensity intervals (HIIT), tempo runs, and long slow distance. 2+ days/week resistance training beneficial for running economy and muscular endurance.
Weekly Plan (4-5 days endurance training):
    • Day 1 - Intervals: HIIT day. E.g., 5-min easy warm-up jog, then 4 x 3 min fast run (~5K race pace or slightly faster) with 2-min jog/walk recovery. Cool down. Develops speed and VO2 max.
    • Day 2 - Easy Run + Strength: 30-40 min easy run (conversational pace, ~60–70% max HR). After, short strength session (20 min) focusing on major muscle groups (lunges, squats, calf raises, planks, glute bridges) 2-3 sets each (bodyweight or light weights).
    • Day 3 - Rest or Active Recovery: Light cycling, swim, or rest. Recovery is critical.
    • Day 4 - Tempo Run: Moderate-hard intensity. E.g., 10 min easy, then 20 min at "comfortably hard" pace (1 hr race pace around lactate threshold), then 5 min easy cooldown. Improves sustained speed and lactate threshold.
    • Day 5 - Cross-Training Cardio: Different endurance activity to reduce impact. E.g., 45 min cycling/swimming/elliptical at a steady moderate effort. Adds aerobic volume without overstressing primary muscles.
    • Day 6 - Long Run: 60-90 min long run at easy pace. Key endurance-building day, pushing distance boundary.
    • Day 7 - Rest: Full rest to consolidate gains.
Progression: Progress volume, introduce more complex periodization. Avoid increasing intensity/volume simultaneously sharply. Extend long run by ~10 min or 1-2 km each week for 3 weeks, then recovery week (drop back). Interval workouts progress by adding more/longer/faster intervals. Periodization around target events: base mileage, add intensity, taper. Running coaches: ~10% rule, reduce mileage 20-30% every 4th week. Limit to 1-2 quality (hard) sessions weekly. Monthly progression better than weekly (resting HR drops, pace improves, long run distance increases). Tapering important before races (cut mileage 50-70% 2 weeks prior). Progressive overload by lengthening duration, increasing frequency, or upping intensity. Mix of strategies. Monitor for overtraining (excess fatigue, elevated HR, persistent soreness). Deload week warranted if signs appear. Progression is balance of increasing stress/recovery.
Adaptations:
    • Frequency: 3 days/week: Hit 1 interval, 1 tempo, 1 long run (slower progress). 6-7 days/week: Vary intensity (max 2 hard days). Competitive runners run 6 days/week, mostly slow recovery. Doubling (two runs/day) for advanced.
    • Session Duration: 20-30 min: Focus on higher-intensity workouts (20-min tempo, interval sprints, vigorous spinning). Maximize stimulus. Longer session on weekend. Even HIIT 2x/week for 15-20 min can significantly improve VO2max.
    • Equipment:
        • Cardio equipment (treadmill, bike, rower): Precise workout control. Treadmills good for intervals/bad weather. Outdoor training for variety.
        • No equipment/space: Running outside simplest. If not feasible: cycling, swimming. Indoors without machines: aerobic videos, high-intensity bodyweight circuits (burpees, jump squats, mountain climbers), jump rope.
        • Use gadgets (HR monitors, GPS) to track progress, ensure right zones. Adapt plan to modalities, maintain easy vs. hard balance, push duration/speed.
`;

export const ENDURANCE_IMPROVEMENT_ADVANCED_GUIDELINES = `
Primary Goal: Cardiorespiratory Endurance (Sustained Aerobic Exercise).
Experience Level: Advanced.
Principles: High-frequency, high-volume program (e.g., 80+ km/week for runners, 8+ hrs aerobic for others) with specialized workouts each day. Intensity periodized, often polarized approach (lots of easy miles, few very hard workouts). Supplemental training: strength (1-2 short sessions), mobility, technical drills.
Weekly Plan (5-6 days endurance training, often with double sessions): Example runner's week:
    • Mon - Easy Recovery Run: 5-8 km at easy pace (Zone 1) for recovery.
    • Tue - Interval Session: E.g., Track repeats (6 × 800m at 5K race pace with 2-min jog recovery) or fartlek (10 × 1 min very fast/1 min easy). Improves speed and VO2max.
    • Wed - Medium Run + Hills: 12-16 km steady-state run (Zone 2 aerobic) including hills. Adds strength endurance.
    • Thu - Tempo Run: E.g., 3 km easy + 8 km at half-marathon pace (comfortably hard) + 2 km easy. Works lactate threshold intensely.
    • Fri - Rest or Light Cross-Training: At least one rest day, or light swim/yoga.
    • Sat - Long Run: 20-30+ km long run for marathoner (2-3 hours easy pace). May include race pace segments. Key endurance-building day.
    • Sun - Cross-Training or Second Run: Long bike ride (2 hrs cycling) or short secondary run ("shakeout run" of 5 km easy). Multi-sport athletes train multiple disciplines.
Progression: Focus on peaking for performance. Long-term periodization cycles (annual plans) with phases: base (high volume, low intensity), build (intensity increased, moderate volume), taper (volume reduced). Progressive overload applied in cycles (2-3 weeks load, 1 week recovery). Gains measured by performance metrics (race times, power output). Incorporate sport-specific details (nutrition during runs, altitude training). Deliberate overloading microcycles ("functional overreaching") followed by unload. Deloading critical (every 3-4 weeks, volume reduced 20%). Off-season of 1-3 weeks rest/cross-training annually. Progression is about quality over quantity, small changes make improvements. Pay attention to data (pace, HR, lactate, power meters). Smarter training, fine-tuning intensity mix, peaking.
Adaptations:
    • Frequency: Ultra-endurance: 7 days/week (at least 1 rest/very easy day). Most: 5-6 days. Cut frequency: maintain performance on fewer days by keeping key workouts, compensate with intensity (injury risk). 6-7 days: Vary intensity (max 2 hard days). 2-on, 1-off pattern common. Multiple sessions/day for high frequency, single quality focus.
    • Session Duration: Can be long (long runs 2-3 hrs, bike rides 4-5 hrs). If time limited, break long session into two (less ideal for ultra-endurance). Main caution: avoid fatigue. Use HRV monitoring.
    • Equipment:
        • Essential: Good shoes, GPS watch (runners); quality bike, indoor trainer, power meter (cyclists); pool access (swimmers).
        • Substitutions: Treadmill incline/stair machine for hills; indoor smart trainers for structured training; plyometric circuits for VO2max maintenance (short-term).
        • Recovery equipment: Foam rollers, compression boots.
        • Overall: Highly optimized. Adjust program to mimic needed stimuli despite constraints (higher intensity in shorter time, cross-training). Adaptations preserve training specificity and overall load.
`;

// --- SPORT PERFORMANCE (ATHLETIC PERFORMANCE FOCUS) ---
export const SPORT_PERFORMANCE_BEGINNER_GUIDELINES = `
Primary Goal: Sport Performance (Improve overall athleticism: strength, power, speed, agility, endurance specific to sport).
Experience Level: Beginner.
Principles: Focus on functional, athletic training – applying strength quickly (power) and sustaining high performance. General off-season training plan for overall capacities. Build a general physical foundation: basic strength, basic endurance, and fundamental movement skills.
Weekly Plan (3-4 days training):
    • Day 1 - Full-Body Strength & Power: Dynamic warm-up. Strength block: 3×5 Back Squats, 3×5 Bench Press at moderate weight (~75% 1RM, good form), 3×8 Bent-Over Rows. Power block: 3×3 Box Jumps (explosive takeoff), 3×5 Medicine Ball Chest Throws (maximal effort, low reps). Finish with 2×10 core (dead bug or planks).
    • Day 2 - Speed/Agility & Conditioning: Technique drills (skips, ladder drills). Speed: 6×40m sprints (full recovery). Agility: 4x shuttle runs (quick changes of direction). Conditioning: 4×200m runs (1 min rest) or 10x "suicides". Builds work capacity, aerobic/anaerobic conditioning.
    • Day 3 - Rest or Light Active Recovery: Light activity (shooting hoops, casual cycling) or rest.
    • Day 4 - Full-Body Strength & Mixed Energy Systems: Similar to Day 1 but with variation: 3×6 Deadlifts, 3×6 Overhead Press. Circuit: 10 kettlebell swings, 10 walking lunges, 10 push-ups (minimal rest for muscular endurance). HIIT finisher (e.g., 5 × 30s battle ropes).
    • Days 5-7: Rest or actual sport skill practice (e.g., pickup game, drills).
Progression: Gradually increase difficulty of each component. Strength: add weight/reps as form improves. Power: progress from simpler to more complex exercises (box jumps to depth jumps), or increase height. Plyometric volume moderate (40 ground contacts/session), increase slightly. Speed: longer sprints or resistance (sled pushes) once mechanics good. Agility: more complex or sport-specific drills. Conditioning: increase interval reps or reduce rest. Spend 6-8 weeks focusing on general conditioning and strength-endurance (higher reps, basic endurance) before moving to heavier/more intense work. General preparatory phase: higher volume, lower intensity early, shift to higher intensity later. Key: consistency, balanced development. Monitor by performance (lifts feel easier, stamina better, faster sprints). Include deload weeks/lighter days (after 3 hard weeks: 50% loads, fewer sets, light aerobics).
Adaptations:
    • Frequency: 2 days/week: Multi-faceted sessions (strength + conditioning; strength + speed/agility). Focus on compound exercises/drills giving "big bang for buck". 4 days: 2 strength, 1 speed/agility, 1 conditioning. 3-day example is balanced.
    • Session Duration: 30-45 min: Prioritize quality over quantity. Speed work not under fatigue. Combine elements carefully. 60-75 min: Logical order (skill/speed first, then strength, then conditioning). Avoid diminishing returns.
    • Equipment:
        • Full gym: Barbells, machines.
        • Minimal equipment (bodyweight/simple tools): Bodyweight/dumbbell squats/push-ups for strength; jumps/bounds for power; cones for sprints/agility; medicine ball for throws.
        • No track/field: Sprints in driveway/stairs.
        • No weight: Unilateral moves, jumps. Agility ladder/chalk marks for footwork.
        • Goal: Mimic movement patterns (quick lateral moves, jumps). Basic plyometrics improve explosiveness. Use creativity to overcome constraints (backpack, resistance bands, hill sprints). Maintain emphasis on multi-directional/compound movements.
`;

export const SPORT_PERFORMANCE_INTERMEDIATE_GUIDELINES = `
Primary Goal: Athletic Performance (Strength, Power, Speed, Agility, Endurance specific to sport).
Experience Level: Intermediate.
Principles: More structured split, often dedicating separate sessions to specific qualities (strength, power, speed, etc.). Volume and intensity are higher than for beginners. Olympic lifts or their variations are introduced once technique is learned. Flexibility/mobility work is important.
Weekly Plan (4-5 days, structured training + skill work): Off-season training example 5 days/week:
    • Day 1 - Strength (Lower Body emphasis): Back Squat (4×5 at 80-85% 1RM), Romanian Deadlift (3×6), Walking Lunges (3×8/leg), Calf Raise (3×12). Core: 3×10 weighted planks. End with 5×10m sled pushes.
    • Day 2 - Strength (Upper Body emphasis): Bench Press (4×5), Weighted Pull-Ups (4×5), Overhead Press (3×6), Barbell Row (3×6). Accessory: 2×10 biceps curls + triceps dips. Medicine ball throws (3×5 chest, 3×5 rotational).
    • Day 3 - Speed & Agility: Dynamic warm-up + technique drills. 8×30m sprints (full recovery). Agility drills: 6× shuttle run (maximal intensity, rest 1 min). Reaction drill: partner signals. Plyometrics: 3×5 depth jumps. Heavy on nervous system, controlled volume.
    • Day 4 - Conditioning/Endurance: Aerobic power intervals: 4 × 4 min running at high intensity (~85-90% max HR) with 3 min jog rest. Or high-intensity circuit: 4 rounds of (30s burpees, 30s rest, 30s kettlebell swings, 30s rest, 30s shuttle run, 30s rest). Mimics sport stop-go nature, trains aerobic/anaerobic. Could include half-court game/scrimmage.
    • Day 5 - Power & Olympic lifts: (If competent) Power Clean (5×3, ~60–70% 1RM, bar speed focus), Hang Snatch (4×3 light-moderate). Alternatives: 3×5 barbell squat jumps, 3×5 plyo push-ups. Agility ladder drills (10 min). Emphasizes explosive training.
    • Days 6-7: Rest and/or sport skill practice (low-key).
Progression: Use more periodization, specialized progression. Training divided into phases (off-season: hypertrophy/general strength -> max strength -> power/explosiveness as season nears). Linear periodization. Concurrent training models exist. Progressive overload still applies within each phase. Progress not always linear across multiple qualities. Periodization helps focus on one primary quality while maintaining others. Deloading/unloading crucial: 3:1 loading cycle (3 hard weeks, 1 lighter week). Metrics: improved jump height, sprint times, weights lifted. Periodization example (Tudor Bompa's model): general prep -> specific prep -> pre-competition. Coordination/agility drills progress by increasing complexity.
Adaptations:
    • Frequency: 3 days/week: Concurrent training per session, but prioritize (Day1 strength/power, Day2 speed/agility, Day3 conditioning). 6 days/week: More split (2 strength, 2 agility/speed, 2 conditioning, skill embedded). Allow ~48 hours between similar intensive sessions. 5-day plan is solid middle ground.
    • Session Duration: 30-45 min: Prioritize quality over quantity (high-quality warm-up, main lift, quick metabolic circuit). Not max absolute strength/endurance but maintains both. 60-75 min: Logical order (skill/speed first, then strength, then conditioning). Collegiate programs often 1.5 hrs. Beware of diminishing returns.
    • Equipment:
        • More equipment: Gym access (squat racks for heavier lifting), track/field access (sprint/agility).
        • Limited: Resistance bands for bodyweight moves (banded jumps, push-ups), sandbags/homemade weights. Hill sprints for power running. Jumping over cones/boxes for plyo. Sport-specific gear (dragging tire). Adapt gym machines to athletic moves.
        • Coordinate training load with actual sport practices (reduce conditioning volume). Use HR monitors. Recovery tools (foam rollers, ice baths) useful. Adapt by focusing on movement patterns.
`;

export const SPORT_PERFORMANCE_ADVANCED_GUIDELINES = `
Primary Goal: Sport Performance (Integrate strength, power, speed, agility, endurance, and skill for highly trained individuals).
Experience Level: Advanced.
Principles: Follow comprehensive, highly individualized, specialized periodized programs. Often multiple sessions per day. High degree of sport-specific work (simulate game situations). Strength training heavy but targeted. Power training specialized (Olympic lifts, advanced plyometrics). Speed training includes technique, reaction, and sport context. Agility integrates cognitive elements. Endurance trained as needed for sport type.
Weekly Plan (5-6 days, integrated and periodized training): Off-season week example:
    • Mon - Max Strength + Auxiliary Lifts: Morning: Heavy Lower-Body Strength (Squat 5×3 @ 90% 1RM, Trap Bar Deadlift 4×4 heavy, Bulgarian Split Squat 3×6 heavy), some plyometric jumps (3×3). Afternoon: Auxiliary upper strength (3×8 Bench, 3×10 Pull-Ups), prehab exercises.
    • Tue - Speed/Power: Morning: Power/Olympic lifting (Power Clean 5×2 @ 80%, Push Jerk 4×3), then Plyometrics (4×5 hurdle hops, 3×8 medicine ball slams). Afternoon: Sprints/agility on field (flying sprints, reactive drills), position-specific skill drills.
    • Wed - Endurance/Conditioning: Single session energy systems focus: High-intensity interval runs (6 × 2 min near max effort with 2 min rest). Or tough metabolic/strongman circuit (tire flips, farmer's carry, sled drag). Finish with steady-state 20 min easy aerobic cooldown.
    • Thu - Reactive/Explosive + Lighter lift: Morning: Plyometric/speed-strength (Depth Jumps 5×3, Bounding drills), Light explosive lifts (jump squats 3×5 @30% 1RM, speed bench throws 3×5). Quickness drills. Afternoon: Lighter technical lifting/strength maintenance (Deadlift 3×3 @ 80% submax, Single-leg RDL 2×6), core work.
    • Fri - Mixed Sport-Specific Conditioning: Small-sided games/scrimmage. Or interval training mimicking sport (e.g., repeated 20s sprints for basketball). Agility under fatigue. Medium day.
    • Sat - Active Recovery: Light swim, stretching, foam rolling, or rest.
    • Sun - Rest: Full rest.
Progression: Highly structured periodization. Block periodization common (4-week blocks: max strength -> power/speed -> pre-season conditioning). Each block has own progression. Microcycles wave load (high intensity week, medium, higher, deload). Monitoring (vertical jump, sprint, 1RM tests, HRV) guides coach. Unloading/tapering phases for performance (1-2 weeks before competition). Periodic deloads essential (every 3-6 weeks, volume reduced 30-50%). Concentrated loading + taper ("functional overreach") is advanced. Progression is about cyclical stress management for small gains. Flexibility; auto-regulate workouts. Periodization is key: daily program manipulation better than non-periodized.
Adaptations:
    • Frequency: Typically 4-5 days/week. 6-7 days/week requires robust recovery/light sessions. 2-on, 1-off pattern common. Multiple sessions/day for high frequency, single quality focus.
    • Session Duration: Long sessions (heavy lifts 2 hours). Coaches keep sessions ~90 min using multiple sessions. If time constrained, partial workouts. Speed before fatigue, strength before conditioning.
    • Equipment:
        • Specialized: Velocity-based training tools, force plates.
        • Substitutions: Heavy kettlebell swings/jump squats as proxy for cleans. Cones for sprints.
        • No gym/environment: Off-ice equivalents (sprints, jumps, strength). Cross-training for general athleticism (injured runner swims/cycles).
        • Recovery equipment: Compression therapy, massage tools.
        • Overall: Specificity is king; training mimics sport demands. Adaptability is key, coaches redesign drills. Underlying principles: train all necessary attributes with available tools, apply progression/periodization logic, address gaps.
`;

// --- GENERAL FITNESS (BALANCED GENERAL FOCUS) ---
export const GENERAL_FITNESS_BEGINNER_GUIDELINES = `
Primary Goal: Broad improvement in overall fitness (mix of moderate strength, endurance, flexibility, body composition).
Experience Level: Beginner.
Principles: Aim to meet basic exercise guidelines (~150 minutes of moderate aerobic exercise per week, 2+ days of full-body strength training). Emphasize variety and consistency to improve all fitness components and prevent boredom. Strength training uses mostly 8-12 rep range.
Weekly Plan (3 days core workouts + light activities):
    • Day 1 - Full-Body Strength Circuit: Perform 8-10 exercises covering all major muscle groups. E.g., Bodyweight Squats (3×12), Modified Push-Ups (3×10), Dumbbell Row (or resistance band row) (3×12), Step-Ups (3×10/leg), Dumbbell Shoulder Press (3×10), Plank (3×30 sec). Move through in circuit fashion or with short rests (~30–60s). Challenging last few reps (10-12 reps). Total time ~30-40 min.
    • Day 2 - Light Cardio Activity: Brisk walk (30 min), or a beginner-friendly exercise class (low-impact aerobics, dance, cycling) at easy pace (talk test).
    • Day 3 - Rest or Stretching: Focus on flexibility (20 minutes of stretching or yoga).
    • Day 4 - Cardio + Core: 5-minute warm-up walk/jog, then jog or cycle (20-25 minutes continuously) at a moderate pace. Intervals (2 min jog / 1 min walk) if needed. Short core routine (3×15 crunches, 3×15 back extensions, 3×30s side planks).
    • Day 5 - Full-Body Strength (alternate exercises): Similar to Day 1, vary movements (e.g., Lunges 3x10/leg, machine/band chest press 3×12, lat pull-down/single-arm dumbbell row 3×10, biceps curls 2×15, triceps dips 2×10). Keep intensity moderate. Use machines for simplicity.
    • Day 6 - Recreational Activity: Do something enjoyable that's active (e.g., hike, swim, tennis, dancing).
    • Day 7 - Rest: Full rest day.
Progression: Primarily by gradually increasing volume or intensity once current routine becomes easier. E.g., if walking 30 min is easy, progress to light jogging intervals or extend to 40 min. If 10 push-ups are easy, try 15 or move from knee push-ups to standard. Principle of progressive overload applies: slightly increase one factor at a time (weight, reps, distance, speed). Doesn't need to be as structured as an athlete's periodization, but some planning helps (e.g., add 5 minutes to cardio sessions weekly). Consistency more important than aggressive progression. Deloading not usually necessary unless fatigued/sore; can be simpler (easier week).
Adaptations:
    • Frequency: 2 days/week: Make each session count by doing full-body strength + some cardio. Slower but significant health benefits gained. 4-5 days/week: Separate modalities more (2-3 strength, 2 cardio days). Adjust to personal schedule.
    • Session Duration: 20 min: High-intensity circuit training for both strength/cardio. Short sessions sprinkled throughout day. 60+ min: Well-rounded (warm-up, strength, cardio, cool-down). Caution workouts >1 hour for newbies.
    • Equipment:
        • Minimal: Calisthenics (squats, push-ups, lunges, planks), walking/running, at-home aerobics.
        • Dumbbells/resistance bands: Add variety with weighted exercises (goblet squats, bent-over rows).
        • Full gym: User-friendly machines (leg press, chest press), variety of cardio machines. Learn free weight basics.
        • Incorporate lifestyle activity (daily step count). Adaptability (shuffle exercises based on setting/travel). Variety is beneficial. Encourage classes. Balance aerobic/resistance training. Flexibility work.
`;

export const GENERAL_FITNESS_INTERMEDIATE_GUIDELINES = `
Primary Goal: Balanced General Fitness.
Experience Level: Intermediate.
Principles: Built an exercise habit and some base strength/endurance. Can handle more frequency and variety, and might start structuring training by days (e.g., strength days vs cardio days). Blends strength training, cardio (interval/steady-state), flexibility, and a hybrid day. Hit strength 2-3 times/week, cardio 2-3 times/week. Volume and intensity increased from beginner.
Weekly Plan (4-5 days, cross-training approach): Example 5-day:
    • Day 1 - Upper-Body Strength & Core: Dumbbell Bench Press (3×8-10), Lat Pulldowns (3×10), Dumbbell Shoulder Press (3×8), Dumbbell Rows (3×10), Bicep Curls (3×12), Triceps Pushdowns (3×12). Short rests (~60s) for cardio effect. Planks (3×45s), Russian twists (3×15).
    • Day 2 - Cardio Intervals (HIIT): 5 min warm-up, then 20 min interval training (e.g., treadmill 1 min fast run/2 min walk, repeat 6-8 times). Or spin bike HIIT (30s all-out sprint/30s slow for 15 rounds). High intensity.
    • Day 3 - Lower-Body & Full-Body Strength: Barbell Squats (4×8, ~70–80% 1RM), Romanian Deadlifts (3×10), Leg Press or Lunges (3×12), Leg Curls (3×12), Calf Raises (3×15). Compound full-body move: Kettlebell Swings (3×10). Short balance/mobility exercise (single-leg balance reach).
    • Day 4 - Flexibility/Mobility & Light Activity: 30-min yoga or dedicated stretching. Active rest day (easy swim/walk).
    • Day 5 - Cardio Endurance (Steady-State): Longer, steady aerobic session. E.g., 45-60 min moderate bike, jog, or swimming (70% max HR, conversational pace). Builds endurance base, burns calories. Split if bored.
    • Day 6 - Total-Body Functional Training: Mixed workout combining strength/cardio. Circuit or CrossFit-style WOD (e.g., 3 rounds for time of 500m row, 15 goblet squats, 15 push-ups, 15 box step-ups, 15 inverted rows). Hits many muscles, high HR, adds variety. Or high-intensity group class.
    • Day 7 - Rest: Full rest.
Progression: Gradually increase load, variety, or complexity. Strength: structured models (linear, periodized). Overload principle: increase weight or change rep scheme (3x8 heavy, 4x12). Incorporate new exercises. Cardio: run faster/farther. Set goals (10K, sprint triathlon). Event-focused plans drive cardio increases. Periodize cardio (increase steady-state session by 5 min/week, improve HIIT intensity). Monitor HR recovery. General fitness periodization can alternate emphasis (strength focus/endurance focus). Change routine every 6-8 weeks to avoid plateaus/maintain engagement. Mindful of recovery: recovery week occasionally (lighter exercise/low-impact activity) to avoid stagnation. Deloads flexible. Auto-regulated.
Adaptations:
    • Frequency: 3 days/week: Condense to full-body workouts (mix cardio/strength each session). Efficient. 6 days/week: Alternate hard/easy days to avoid burnout. Possible to exercise daily with modulated intensity.
    • Session Duration: Moderate (45-60 min): Separate strength/cardio days. Short (<30 min): High-intensity circuit training/supersets for robust stimulus. Long (90 min): Warm-up/cool-down, segment (30 min cardio + 30 min strength + 30 min sports). Split morning/evening.
    • Equipment:
        • Gym membership/decent home gym: More variety. Free weights (stabilizer muscles), machines (isolation), cardio machines (different modalities). Rotating cardio equipment.
        • Minimal equipment (dumbbells, pull-up bar): Calisthenics at higher difficulty (pull-ups, pistol squats, handstand holds). Adjustable dumbbells/kettlebells. HIIT using bodyweight.
        • Group classes/sports: Integrate pickup basketball, yoga.
        • Focus: Health markers (weight, muscle tone, cardiovascular health). Adapt to travel/seasons. Intermediate autonomy in modifying routine.
`;

export const GENERAL_FITNESS_ADVANCED_GUIDELINES = `
Primary Goal: Balanced General Fitness (Achieve high levels of all-around fitness, "hybrid athletes").
Experience Level: Advanced.
Principles: Integrate strength, power, speed, agility, endurance, and skill. Covers heavy strength, hypertrophy, HIIT/metcon, endurance, recovery. Maintains high fitness across the board, not necessarily elite in one domain.
Weekly Plan (5-6 days, well-rounded with specialization):
    • Day 1 - Heavy Strength Training: Compound lifts with heavy loads to maintain/build strength. E.g., Barbell Squats (5×5), Deadlifts (5×3), Bench Press (5×5), Barbell Rows (4×6). Long rests (2-3 min) for neural recovery.
    • Day 2 - High-Intensity Cardio + Calisthenics: CrossFit WOD (e.g., "Cindy": 5 pull-ups, 10 push-ups, 15 squats, AMRAP 20 min). Or sprint intervals (10×100m fast, 1 min rest) with bodyweight moves. Blends muscular endurance/cardio.
    • Day 3 - Mobility and Active Recovery: 30 min foam rolling, stretching, massage. Leisurely swim/easy cycle to promote blood flow. Prevents injury, maintains joint health.
    • Day 4 - Volume Strength + Hypertrophy: Moderate weights, higher reps. E.g., Overhead Press (4×8), Dumbbell Lunges (4×10), Pull-Ups (3×12), Cable Rows (3×15), Push-ups (3×15), Hamstring curls (3×15), Calf raises (3×15). Core circuit. Shorter rests (~60-90s).
    • Day 5 - Long Endurance or Sport: Long run (15+ km) or long hike/bike (2 hrs). Or sport day (2 hrs pickup soccer/basketball). Maintains endurance.
    • Day 6 - Functional / HIIT Circuit: Mixed modality: tire flips, kettlebell swings, burpee broad jumps, rowing machine sprints, farmers' carry (3 rounds). Or advanced HIIT class/F45/OrangeTheory. Emphasis on full-body movements, power, stamina.
    • Day 7 - Rest: Full rest with good nutrition/sleep.
Progression: Periodizing emphases, preventing burnout. Cycle goals (e.g., 3 months half-marathon prep then 3 months muscle/strength focus). Block approach (focus on 1-2 attributes, maintain others). Auto-regulation (listen to body, adjust intensity). Track metrics (HR, pace, weights, body composition). Set specific targets, plan accordingly. Gains incremental. Deloading absolutely important: light week every 4-6 weeks (volume/intensity reduced ~50%). Incorporate deliberate recovery protocols (contrast baths, sleep, massage). Modest improvements over year. Periodization can be concurrent. Focus on optimization and sustaining high level, not just big gains. Temporarily specialize to break plateaus. Guard against injury.
Adaptations:
    • Frequency: 3-4 days/week: Accept maintenance. Combine modalities in single sessions. 7 days: Include couple low-intensity days. Some activity daily.
    • Session Duration: Can be long (long run + core 2 hrs). Manage time with two-a-days. If 1 hr/day: Alternate pure strength/cardio. Need longer sessions occasionally. Efficiency tools: supersets, circuit training. Careful periodization means not always doing everything at once.
    • Equipment:
        • Lots of equipment: Home gym, bike, pool membership. Wearables (GPS, HR monitor).
        • Limited: Adapt by bodyweight/creative workouts. Maintain "advanced" levels with some equipment help. Bodyweight variations (one-arm pushups, pistol squats) for strength. High-rep bodyweight circuits (burpees) for cardio.
        • Goal-dependent: 500 lb deadlift needs barbell. 20 pull-ups/50 push-ups needs bodyweight.
        • Flexibility: Trade off absolute strength for convenience. Maximize broad range: Broad equipment.
        • Lifestyle integration (cycle to work, lunchtime gym, sports). Adapt to travel (hotel gym/bodyweight). Know how to improvise. Keep body challenged in diverse ways, equipment is facilitator.
`;

// Add more categories if present in the PDF, following the same pattern.