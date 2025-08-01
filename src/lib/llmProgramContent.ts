// src/lib/llmProgramContent.ts
// -----------------------------------------------------------------------------
// Evidence-based exercise science guidelines for LLM program generation (2025).
// Design notes:
// • Comprehensive scientific context for accurate AI program creation
// • Research-backed principles with practical implementation protocols
// • Detailed explanations for physiological rationale and application
// • Integration with existing autoregulation, periodization, and volume systems
// -----------------------------------------------------------------------------

// ═══════════════════════════════════════════════════════════════════════════════
//                           VOLUME FRAMEWORK GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════

export const VOLUME_FRAMEWORK_GUIDELINES = `
SCIENTIFIC PRINCIPLES
Volume landmarks represent the dose-response relationship between training volume and adaptation. Based on meta-analyses by Schoenfeld et al. (2024) and systematic reviews by Israetel et al. (2024):

• MEV (Minimum Effective Volume): The threshold volume below which no meaningful adaptation occurs. Represents ~40-60% of MAV for most individuals. MEV varies by muscle group, training status, and individual recovery capacity.

• MAV (Maximum Adaptive Volume): The volume range where the greatest rate of adaptation occurs per unit of additional volume. This is the "sweet spot" where training stimulus maximizes adaptation while minimizing unnecessary fatigue accumulation.

• MRV (Maximum Recoverable Volume): The ceiling volume beyond which performance decreases due to incomplete recovery. Exceeding MRV leads to overreaching, reduced adaptation, and potential injury risk.

IMPLEMENTATION PROTOCOLS
Progressive Volume Application:
1. Baseline Assessment: Start new trainees at MEV, intermediates at 60-70% of MAV, advanced at 70-80% of MAV
2. Linear Progression: Increase volume by 1-2 sets per muscle per week until approaching MAV
3. Wave Loading: Upon reaching MAV, implement 3:1 loading (3 weeks progressive, 1 week deload to MEV)
4. Individual Adjustment: Monitor performance markers, RPE trends, and recovery indicators

Muscle-Specific Volume Guidelines (weekly sets):
• Chest: MEV 8-10, MAV 14-22, MRV 24-28
• Back: MEV 10-14, MAV 16-26, MRV 28-32  
• Shoulders: MEV 8-12, MAV 14-20, MRV 22-26
• Arms: MEV 6-10, MAV 12-18, MRV 20-24
• Quads: MEV 8-12, MAV 14-20, MRV 22-26
• Hamstrings/Glutes: MEV 6-10, MAV 10-16, MRV 18-22

PRACTICAL EXAMPLES
Beginner (0-1 years): Start at MEV across all muscle groups. Focus on movement quality and neurological adaptation. Volume tolerance is limited due to underdeveloped work capacity.

Intermediate (1-3 years): Operate primarily in MEV to mid-MAV range. Can handle moderate volume fluctuations. Periodize volume in 4-6 week blocks with planned deloads.

Advanced (3+ years): Can approach MAV regularly and briefly exceed into low MRV ranges during specialization phases. Requires sophisticated periodization and careful fatigue monitoring.

INTEGRATION NOTES
Volume landmarks integrate with autoregulation through RPE monitoring - if session RPE consistently exceeds targets, volume may be approaching MRV. Combine with HRV, sleep quality, and subjective wellness markers for comprehensive monitoring. Adjust volume based on life stress, training age, and individual recovery capacity as defined in VolumeParameters interface.
`;

// ═══════════════════════════════════════════════════════════════════════════════
//                          AUTOREGULATION GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════

export const AUTOREGULATION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
Autoregulation optimizes the training stimulus by adjusting load and volume based on real-time readiness indicators. Research by Helms et al. (2024) and reactive training systems demonstrates superior outcomes when training adapts to individual daily fluctuations in performance capacity.

RPE Scale Implementation (Borg CR-10):
• RPE 1-3: Minimal effort, warm-up range
• RPE 4-6: Moderate effort, active recovery
• RPE 7: Challenging but sustainable, ~3-4 RIR
• RPE 8: Hard effort, ~2 RIR, primary training zone
• RPE 9: Very hard, ~1 RIR, limit work
• RPE 10: Maximal effort, 0 RIR, testing only

Fatigue Management Principles:
• Acute fatigue (session-to-session): Managed through daily autoregulation
• Functional overreaching: Planned 2-4 week periods of high stress followed by recovery
• Non-functional overreaching: Avoided through monitoring and preemptive adjustments

IMPLEMENTATION PROTOCOLS
Daily Readiness Assessment:
1. Subjective Wellness Scale (1-10): Sleep quality, energy level, mood, motivation
2. HRV Measurement (if available): >10% deviation from baseline indicates fatigue
3. Previous Session RPE Review: Compare intended vs actual RPE

Load Adjustment Matrix:
• High Readiness (8-10/10): Increase load 2-5% or add volume
• Normal Readiness (6-7/10): Execute planned session
• Low Readiness (4-5/10): Reduce intensity 10-20% or volume 20-30%
• Very Low Readiness (<4/10): Active recovery or complete rest

Session RPE Targets by Phase:
• Accumulation: 6-8 RPE, emphasizing volume
• Intensification: 7-9 RPE, emphasizing load
• Realization: 8-10 RPE, peaking activities
• Deload: 4-6 RPE, restoration focus

PRACTICAL EXAMPLES
Scenario 1 - High Stress Week: Reduce planned intensity by 15-20%. Focus on movement quality and technique refinement. Increase rest periods. Consider additional recovery modalities.

Scenario 2 - Feeling Strong: If readiness markers are high, add 2-5% load or 1-2 additional sets. Avoid dramatic increases that could lead to overreaching.

Scenario 3 - Chronic Fatigue: Implement 5-7 day deload with 40-50% volume reduction. Address sleep, nutrition, and stress management. Resume with reduced baseline loads.

INTEGRATION NOTES
Autoregulation works synergistically with periodization - use daily adjustments within planned phases rather than replacing structured programming. RPE data feeds into weekly volume adjustments and deload timing decisions. Integrates with existing RPEProfile interface for individualized target ranges and autoregulation rules.
`;

// ═══════════════════════════════════════════════════════════════════════════════
//                          PERIODIZATION GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════

export const PERIODIZATION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
Periodization systematically varies training variables to optimize adaptation while managing fatigue. Meta-analyses by Afonso et al. (2024) demonstrate superiority of periodized vs non-periodized training for strength and hypertrophy outcomes.

Periodization Models:
• Linear: Progressive increase in intensity with volume reduction
• Daily Undulating (DUP): Session-to-session variation in intensity/volume
• Block: Sequential emphasis on specific adaptations
• Conjugate: Simultaneous development of multiple qualities

Adaptation Phases:
• General Preparation: Build work capacity, movement quality, base fitness
• Specific Preparation: Sport/goal-specific development
• Competition/Realization: Peak performance expression
• Transition/Recovery: Active rest and regeneration

IMPLEMENTATION PROTOCOLS
Block Periodization Structure:
Phase 1 - Accumulation (3-4 weeks):
• Volume: High (80-90% MAV)
• Intensity: Moderate (65-80% 1RM)
• Focus: Hypertrophy, work capacity
• RPE Target: 6-8

Phase 2 - Intensification (2-3 weeks):
• Volume: Moderate (60-75% MAV)
• Intensity: High (80-90% 1RM)
• Focus: Strength, power
• RPE Target: 7-9

Phase 3 - Realization (1-2 weeks):
• Volume: Low (40-60% MAV)
• Intensity: Very High (90-100% 1RM)
• Focus: Peak performance, testing
• RPE Target: 8-10

Daily Undulating Periodization:
• Monday: High Volume (8-12 reps, 70-80% 1RM)
• Wednesday: High Intensity (3-5 reps, 85-90% 1RM)
• Friday: Moderate (6-8 reps, 75-85% 1RM)

PRACTICAL EXAMPLES
Hypertrophy-Focused Block:
Weeks 1-4: Volume accumulation at 70-80% intensity
Weeks 5-6: Intensification at 80-90% intensity
Week 7: Deload at 60-70% volume
Repeat with slightly higher baseline volumes

Strength-Focused Block:
Weeks 1-2: Base volume building
Weeks 3-5: Intensification with heavy loads
Week 6: Peaking and testing
Week 7: Recovery and assessment

Powerlifting Competition Prep:
12 weeks out: High volume hypertrophy work
8 weeks out: Transition to strength focus
4 weeks out: Competition movement specificity
1 week out: Taper and peak

INTEGRATION NOTES
Periodization provides the macro-structure while autoregulation handles daily adjustments. Volume landmarks define the ranges within each phase. Weak point identification determines exercise selection priorities. Integrates with existing PeriodizationModel interface for phase definitions and adaptation targets.
`;

// ═══════════════════════════════════════════════════════════════════════════════
//                      WEAK POINT INTERVENTION GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════

export const WEAK_POINT_INTERVENTION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
Strength imbalances create performance limitations and injury risk. Research by Cook et al. (2024) and movement screening protocols identify common ratios for balanced development. Systematic weak point correction improves overall performance and reduces asymmetry-related injury risk.

Key Strength Ratios:
• Squat:Deadlift = 0.75-0.9 (posterior chain assessment)
• Bench:Deadlift = 0.6-0.8 (upper body relative strength)
• Overhead Press:Bench = 0.6-0.75 (vertical pressing capacity)
• Bent Row:Bench = 0.9-1.1 (horizontal push-pull balance)

Common Imbalance Patterns:
• Quad-dominance: Weak posterior chain (glutes, hamstrings)
• Upper cross syndrome: Weak posterior delts, rhomboids, deep cervical flexors
• Lower cross syndrome: Weak glutes, deep core stabilizers
• Anterior dominance: Overdeveloped anterior chain, weak posterior muscles

IMPLEMENTATION PROTOCOLS
Weak Posterior Chain Intervention:
Primary Exercises: Romanian deadlifts, good mornings, glute-ham raises, hip thrusts
Volume Allocation: 2x weekly frequency, 12-16 sets per week
Progression: Start bodyweight/light load, progress to 80-90% effort
Duration: 6-8 week focused phases
Monitoring: Retest squat:deadlift ratio monthly

Weak Vertical Pressing Intervention:
Primary Exercises: Overhead press variations, handstand progressions, pike push-ups
Volume Allocation: 3x weekly frequency, 8-12 sets per week
Progression: Focus on strict form, gradual load increases
Duration: 4-6 week phases
Monitoring: Track overhead press:bench ratio

Horizontal Push-Pull Imbalance:
Primary Exercises: Face pulls, rear delt flies, bent-over rows, chin-ups
Volume Allocation: 2:1 pull:push ratio during correction phase
Progression: Higher frequency (daily) for corrective work
Duration: Ongoing until ratio normalized

PRACTICAL EXAMPLES
Scenario 1 - Weak Glutes (Low Squat:Deadlift):
Week 1-2: Glute activation work (monster walks, clamshells)
Week 3-4: Hip thrust progression, Romanian deadlifts
Week 5-6: Loaded carries, single-leg deadlifts
Week 7-8: Heavy hip thrusts, pause squats
Assessment: Retest ratio and movement quality

Scenario 2 - Weak Shoulders (Low OHP:Bench):
Week 1-2: Shoulder mobility and stability work
Week 3-4: Light overhead pressing, wall handstands
Week 5-6: Progressive overhead press, pike push-ups
Week 7-8: Loaded overhead carries, press variations
Assessment: Overhead press strength test

Scenario 3 - Forward Head Posture:
Daily: Chin tucks, upper trap stretches
3x/week: Face pulls, band pull-aparts
2x/week: Prone Y-T-W raises, reverse flies
1x/week: Deep cervical flexor strengthening
Duration: 12+ weeks for postural adaptations

INTEGRATION NOTES
Weak point interventions should be prioritized during accumulation phases when volume tolerance is highest. Use WeakPointAnalysis interface data to identify specific ratios needing attention. Integrate corrective exercises into warm-ups or as primary movements depending on severity. Monitor through regular strength testing and movement screens.
`;

// ═══════════════════════════════════════════════════════════════════════════════
//                         FATIGUE MANAGEMENT GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════

export const FATIGUE_MANAGEMENT_GUIDELINES = `
SCIENTIFIC PRINCIPLES
Fatigue management optimizes the recovery-adaptation cycle. Research by Kellmann et al. (2024) identifies fatigue as a multifaceted phenomenon requiring systematic monitoring and intervention. Proper fatigue management prevents overtraining while maximizing adaptation.

Types of Fatigue:
• Metabolic: Accumulation of metabolic byproducts, depleted energy substrates
• Neurological: CNS depression, reduced motor unit recruitment
• Psychological: Motivation decline, increased perceived effort
• Structural: Muscle damage, inflammation, tissue stress

Recovery Markers:
• Objective: HRV, resting HR, sleep metrics, performance tests
• Subjective: Mood, motivation, energy, soreness levels
• Functional: Movement quality, coordination, power output

Fatigue Accumulation Timeline:
• Acute (hours): Within-session fatigue, managed by rest periods
• Short-term (days): Session-to-session recovery, managed by programming
• Medium-term (weeks): Cumulative stress, managed by deloads
• Long-term (months): Seasonal fatigue, managed by periodization

IMPLEMENTATION PROTOCOLS
Daily Fatigue Monitoring:
1. Morning Assessment: HRV, resting HR, subjective wellness (1-10 scale)
2. Pre-session: Motivation, energy level, previous session recovery
3. During Session: RPE tracking, performance metrics
4. Post-session: Soreness prediction, recovery planning

Deload Timing Indicators:
• Performance decline >5% on key lifts for 2+ sessions
• RPE increases >1 point for same loads across 3+ sessions
• Subjective wellness scores <6/10 for 3+ consecutive days
• HRV decreases >10% from baseline for 3+ days
• Sleep quality consistently poor (<7/10) despite good hygiene

Deload Protocols:
Light Deload (50-60% volume reduction):
• Maintain movement patterns with reduced loads
• Focus on technique refinement
• Duration: 3-5 days
• Use: Mild accumulated fatigue

Moderate Deload (60-70% volume reduction):
• Reduce both volume and intensity
• Add recovery modalities
• Duration: 5-7 days
• Use: Moderate fatigue, lifestyle stress

Heavy Deload (70-80% volume reduction):
• Minimal training stimulus
• Focus entirely on recovery
• Duration: 7-10 days
• Use: High fatigue, signs of overreaching

PRACTICAL EXAMPLES
Planned Deload Schedule:
• Every 4 weeks for beginners
• Every 3-4 weeks for intermediates
• Every 2-3 weeks for advanced athletes
• Variable timing based on autoregulation

High-Stress Period Management:
• Reduce training volume by 20-30%
• Increase sleep focus (extra 30-60 minutes)
• Add stress reduction techniques (meditation, yoga)
• Monitor recovery markers more frequently
• Extend warm-up and cool-down periods

Competition/Peak Phase Recovery:
• Daily HRV monitoring
• Massage therapy 2x weekly
• Contrast showers/ice baths
• Nutrition periodization
• Sleep optimization protocols
• Active recovery sessions

INTEGRATION NOTES
Fatigue management integrates with autoregulation for daily adjustments and periodization for planned recovery phases. Use RecoveryProfile interface data to customize fatigue thresholds and recovery protocols. Combine with volume landmarks to prevent exceeding MRV consistently. Inform deload timing through cumulative RPE trends and subjective wellness data.
`;

// ═══════════════════════════════════════════════════════════════════════════════
//                        EXERCISE SELECTION GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════

export const EXERCISE_SELECTION_GUIDELINES = `
SCIENTIFIC PRINCIPLES
Exercise selection optimizes stimulus-to-fatigue ratio (SFR) while addressing individual needs, preferences, and constraints. Research by Vigotsky et al. (2024) demonstrates that exercise effectiveness depends on multiple factors including biomechanics, load-response characteristics, and individual anatomy.

Stimulus-to-Fatigue Ratio Hierarchy:
• High SFR: Compound movements with favorable biomechanics, moderate load
• Moderate SFR: Isolation movements, machine exercises, specialized variations
• Low SFR: Exercises requiring excessive stabilization, poor biomechanical fit

Movement Pattern Categories:
• Hip Hinge: Deadlift variations, good mornings, kettlebell swings
• Squat: Back squat, front squat, goblet squat, split squat
• Horizontal Push: Bench press, push-ups, dumbbell press
• Horizontal Pull: Rows, chin-ups, pull-ups
• Vertical Push: Overhead press, handstand push-ups
• Vertical Pull: Lat pulldowns, high pulls
• Loaded Carry: Farmer's walks, suitcase carries, overhead carries

IMPLEMENTATION PROTOCOLS
Exercise Prioritization Framework:
Tier 1 (Primary): Compound movements matching training goals
• Volume allocation: 60-70% of total training volume
• Examples: Squat, deadlift, bench press, row
• Progression focus: Load and volume increases

Tier 2 (Secondary): Supporting compound movements and targeted isolation
• Volume allocation: 20-30% of total training volume
• Examples: Romanian deadlifts, incline press, chin-ups
• Progression focus: Technique refinement and moderate loading

Tier 3 (Accessory): Isolation, mobility, and corrective exercises
• Volume allocation: 10-20% of total training volume
• Examples: Lateral raises, curls, face pulls, stretches
• Progression focus: Movement quality and metabolic stress

Individual Exercise Selection Criteria:
1. Anthropometric Compatibility: Limb lengths, joint mobility, injury history
2. Equipment Availability: Home gym, commercial gym, minimal equipment
3. Time Constraints: Session duration, exercise complexity
4. Experience Level: Technique mastery, loading capacity
5. Goal Specificity: Strength, hypertrophy, endurance, sport performance

PRACTICAL EXAMPLES
Hypertrophy-Focused Selection:
• Choose exercises allowing full ROM through lengthened position
• Prioritize constant tension over maximum load
• Include variety for complete muscle development
• Example: Incline dumbbell press > flat barbell press for chest development

Strength-Focused Selection:
• Prioritize competition movements or close variations
• Choose exercises allowing progressive overload
• Minimize unnecessary complexity
• Example: Low bar squat > goblet squat for powerlifting

Limited Equipment Selection:
• Emphasize bodyweight progressions
• Use unilateral variations to increase difficulty
• Employ tempo manipulations for intensity
• Example: Single-leg pistol squat > barbell back squat

Time-Constrained Selection:
• Choose compound movements affecting multiple muscle groups
• Use supersets and circuits for efficiency
• Minimize setup and transition time
• Example: Thruster > separate squat and press

Injury Accommodation:
• Select pain-free ROM exercises
• Use machines for stability when needed
• Employ isometric holds for strength maintenance
• Example: Trap bar deadlift > conventional deadlift for lower back issues

INTEGRATION NOTES
Exercise selection integrates with weak point analysis to prioritize corrective movements. Use volume landmarks to determine appropriate exercise volume within each tier. Consider autoregulation principles when selecting exercise variations based on daily readiness. Align exercise complexity with current fatigue levels and training phase goals.
`;

// ═══════════════════════════════════════════════════════════════════════════════
//                              LEGACY GUIDELINES
//                        (Maintained for Compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

// Note: Maintaining existing exports for backward compatibility while the system transitions
// to using the new comprehensive guidelines above.

export const MUSCLE_GAIN_BEGINNER_GUIDELINES = `
PRINCIPLES
• 3 full‑body sessions → high‑frequency boosts motor learning & volume quality.
• 8–12 reps (~65–75 % 1RM) to near‑failure (RIR 1‑2) after technique is sound.
• Volume landmarks: Start at MEV (8-10 sets/muscle/week), progress to MAV (12-16 sets/muscle/week). Do not exceed MRV (18 sets/muscle/week) for beginners.
• Protein ≥1.6 g·kg‑1·d‑1, 5–10 % kcal surplus.
• Rest — Compounds **90–180 s**; Isolation **60–90 s**.

WEEKLY PLAN (3 d)
Day1 Sq 3×8‑10 · BP 3×8‑10 · Row 3×8‑10 · Curls/Dips 2×12
Day2 Rest / walk 30 min
Day3 DL 3×6 · OHP 3×8 · Pull‑Up 3×AMAP · Plank 3×30 s
Day4 Rest
Day5 Leg Press 3×12 · DB Bench 3×12 · DB Row 3×12 · Lunges/LR 2×15
Weekend Active recovery

PROGRESSION
• 2‑for‑2 rule (+2 reps in two sessions → +5 % load).  Deload wk 8 (‑50 % volume).

OPTIONS
• 2 d/wk: keep same lifts, bump sets to hit volume. 4 d: upper/lower split.
• Minimal equipment: DB/BW variants, tempo slow eccentrics.
`;

export const MUSCLE_GAIN_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• My approach for you is hitting each muscle group twice a week; the science shows this is superior for growth when volume is equated.
• Volume landmarks: Start at MEV (10-12 sets/muscle/week), progress towards MAV (18-22 sets/muscle/week) over the training block. Do not exceed MRV (24 sets/muscle/week).
• Load mix: 6–12 main, 12–20 metabolite work. RPE 7‑9.
• Rest — Compounds **90–180 s**; Isolation **60–90 s** (shorter only if adding sets).

WEEKLY PLAN (5 d Upper/Lower/Pull/Push/Legs)
U1 Bench 4×8 · Incl DB 3×10 · OHP 3×10 · Tri‑Ext 3×12
L1 Sq 4×8 · RDL 3×10 · Press 3×12 · Calf 3×15
Pull Row 4×8 · Chin 3×6 · Cable Row 3×10 · Curl 3×12
Push Incl Press 3×8 · Seated DB OHP 3×10 · Fly 3×15 · Dip 3×AMAP
Legs2 Front Sq 3×8 · Hip Thrust 3×10 · Curl 3×12 · Split Sq 3×12

PROGRESSION
• 3‑wk volume (add set) → 3‑wk intensity (add load) → deload.

OPTIONS
• 3 d: Upper/Lower/Full. 6 d: PPL×2.
`;

export const MUSCLE_GAIN_ADVANCED_GUIDELINES = `
PRINCIPLES
• My approach for you is hitting each muscle group at least twice a week. The 2024 meta-regression research confirms this is best for growth.
• Volume landmarks: Start at MEV (12-15 sets/muscle/week), progress towards MAV (20-25 sets/muscle/week) over the training block. Experienced users can approach MRV (26-28 sets/muscle/week) but monitor recovery closely.
• Include mechanical tension (5–8 reps), hypertrophy zone (8–12), metabolite (15‑20).
• Intensity techniques ≤10 % volume.
• Rest — Heavy sets **2–3 min**; other compounds **90–120 s**; isolation **60–90 s**.

WEEKLY PLAN (6 d Push/Pull/Legs ×2)
Push‑A Bench 4×6 · OHP 3×8 · Dips 3×8 · Fly 2×15
Pull‑A DL 3×5 · Row 3×8 · Chin 3×6 · Face Pull 2×15
Legs‑A Sq 4×6 · RDL 3×8 · Press 3×10 · Calf 3×15
Push‑B Incl DB 4×10 · DB OHP 3×10 · Cross 3×15 · Tri 3×12
Pull‑B Pend Row 3×8 · LPD 3×10 · RevFly 3×15 · Curl 3×12
Legs‑B Front Sq 3×8 · Hip Thrust 3×10 · Curl 3×12 · Split Sq 3×12
Sun Rest

PROGRESSION
• Daily undulating: Heavy / Moderate / Pump rotation. 3‑wk wave then deload (‑40 %).

OPTIONS
• 5 d UL‑PPL if recovery limited.  <45 min sessions: keep first 3 lifts, superset isolation.
`;

export const STRENGTH_GAIN_BEGINNER_GUIDELINES = `
PRINCIPLES
• Focus on Squat, Press, Deadlift, Row; 3×5 @80‑85 % builds neural efficiency.
• Rest — Main lifts **3–5 min** on heaviest sets, 2‑3 min on back‑offs; perfect form non‑negotiable.

WEEKLY PLAN (3 d A/B alt.)
A Sq 3×5 · BP 3×5 · Row 3×6‑8
B DL 1×5 top · OHP 3×5 · Pull‑Up 3×AMAP

PROGRESSION
• +2‑2.5 kg/ session until fail twice, then deload 10 % and rebuild.

OPTIONS
• DB/BW only: heavy goblet, unilateral, slow tempo (5‑8 reps).
`;

export const STRENGTH_GAIN_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• 4 d Upper/Lower H‑L. Periodization > linear (2023 meta‑analysis).
• Main lifts 3‑6 reps @RPE 7‑8; accessories 6‑12.
• Volume landmarks for accessories: MEV (8-10 sets/muscle/week), progress to MAV (14-18 sets/muscle/week). Focus on movement-specific strength over hypertrophy volume.
• Rest — Top sets **3–5 min**; back‑offs **2–3 min**; accessories **90 s**.

WEEKLY PLAN
U‑H Bench 5×5 · OHP 3×6 · Row 4×6 · W‑Pull‑Up 3×5
L‑H Sq 5×5 · DL 3×5 · Lunge 3×8 · GHR 3×10
U‑L Bench 3×8 @70 % · OHP 3×8 · Lat Pull 3×10
L‑L Front Sq 3×8 · RDL 3×8 · Leg Press 3×10

PROGRESSION
• Weekly +2 % load ≥ main lifts, deload every 4‑6 wks.
`;

export const STRENGTH_GAIN_ADVANCED_GUIDELINES = `
PRINCIPLES
• Daily undulating or block periodization. Competition-specific.
• Volume landmarks: MEV (6-8 sets/muscle/week) for accessories, focus primarily on main lift volume and frequency.
• Rest — Singles **3–5 min**; doubles/triples **2–3 min**; accessories **90 s**.

WEEKLY PLAN (4‑5 d specialist)
Day1 Sq heavy 5×3 @90 % · pause bench 3×5 · accessories
Day2 Bench heavy 5×3 @90 % · front sq 3×6 · back/arms
Day3 DL heavy 3×3 @90 % · comp bench 3×5 · accessories  
Day4 Sq speed 8×3 @60 % · bench volume 5×5 @80 %
Day5 (optional) Accessories, weak points, mobility

PROGRESSION
• 3‑wk linear → deload → retest openers → adjust %.
`;

export const ENDURANCE_IMPROVEMENT_BEGINNER_GUIDELINES = `
PRINCIPLES
• Base-building: 80 % easy effort, 20 % moderate‑hard.
• 3‑4 sessions; 1 longer, 1‑2 tempo/intervals.

PLAN
D1 Easy 20‑30 min Z1 (conversational)
D3 Tempo 20 min with 5×2 min @comfortably hard
D5 Easy 25‑40 min steady
D7 (optional) 15 min easy recovery

PROGRESSION
• +5 min on long day, +1 interval weekly until 45‑60 min.
`;

export const ENDURANCE_IMPROVEMENT_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Polarised training: 80 % easy, 10 % tempo, 10 % high‑intensity.
• 4‑5 sessions, include 1 strength workout.

PLAN
Mon Easy 45 min Z1
Wed Interval 5×4 min @5 K pace
Fri Tempo 30 min @10 K‑HM pace  
Sat Long 60‑90 min + strength circuit
Sun 30 min easy or rest

PROGRESSION
• Build long run +10 min bi‑weekly; vary interval format monthly.
`;

export const ENDURANCE_IMPROVEMENT_ADVANCED_GUIDELINES = `
PRINCIPLES
• Polarised (80 % easy / 20 % hard) outperforms threshold alone (2024 meta).
• 5‑6 d, optional doubles, 1‑2 strength sessions.

PLAN (example runner)
Mon Easy 8 km Z1
Tue Track 6×800 m @5 K pace
Wed Medium 14 km steady + hills
Thu Tempo 8 km @HM pace
Fri Rest / swim mobility
Sat Long 24 km easy+RP segments
Sun Bike 2 h steady or 5 km shake‑out

PROGRESSION
• 3‑wk load / 1‑wk unload (‑20 % vol). Macro: Base‑Build‑Peak‑Taper.
`;

export const SPORT_PERFORMANCE_BEGINNER_GUIDELINES = `
PRINCIPLES
• Build broad base: strength, power, speed, conditioning.
• 2–3 key sessions; quality > quantity.
• Rest — Heaviest lift dictates (**2–3 min**); speed drills full recovery; metabolic circuits **30–45 s**.

PLAN (3 d)
D1 Strength+Power: Sq 3×5 · BP 3×5 · Row 3×8 · Box Jump 3×3
D2 Speed/Agility: 6×40 m sprint, ladder drills, 4× shuttle; Finish 4×200 m run
D3 Strength mix: DL 3×5 · OHP 3×6 · KB swing 10×3 · HIIT ropes 5×30 s

PROGRESSION
• Add weight when RPE <7; sprint add distance or resisted sled.
`;

export const SPORT_PERFORMANCE_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Separate qualities – 4‑5 d split (strength, speed, power, conditioning).
• Olympic lifts for RFD; block periodisation in off‑season.
• Rest — Strength blocks **2–3 min**; power & speed drills full recovery; conditioning **30–60 s**.

PLAN (5 d)
Str‑L Sq 4×5 · RDL 3×6 · Split Sq 3×8
Str‑U BP 4×5 · PU 4×5 · MedBall 3×5 chest+rotational
Speed 8×30 m, agility drills, plyo 3×5 depth jumps
Cond 4×4 min @90 % HRmax · circuit finisher
Power PC 5×3@70 %1RM · Hang Sn 4×3 · hurdle hops 4×5

PROGRESSION
• 3:1 load‑deload; shift emphasis prep → pre‑season.
`;

export const SPORT_PERFORMANCE_ADVANCED_GUIDELINES = `
PRINCIPLES
• Integrated high‑frequency, multi‑session days; periodised blocks (max‑strength → power → sport‑specific conditioning).
• Monitor with jump height, HRV, GPS.
• Rest — Max strength **3–5 min**; power/speed full recovery; mixed games as per coach.

PLAN (5‑6 d)
Mon AM Max‑Str Sq 5×3 @90 % · PM Aux Upper
Tue AM Power Clean 5×2 · Plyo · PM Speed & agility w/ skill drills
Wed HIIT 6×2 min near‑max or strongman circuit
Thu Reactive plyo + lighter tech lifts
Fri Small‑sided games / repeated sprint training
Sat Active recovery · Sun Rest

PROGRESSION
• 4‑wk blocks, taper before comp; deload every 3 wks (‑30 % vol).
`;

export const GENERAL_FITNESS_BEGINNER_GUIDELINES = `
PRINCIPLES
• Meet ACSM: 150 min mod cardio + 2 strength days; variety for adherence.
• RPE 5‑6 aerobic; RIR 2‑3 strength.
• Rest — Strength circuits **60–90 s**; walking/jogging as needed.

PLAN
D1 Full‑Body circuit 8‑10 moves 3×12
D2 Brisk walk 30 min
D4 Jog 25 min + core 3×15
D5 Strength alt exercises 3×12
D6 Recreational sport

PROGRESSION
• Add 5 min cardio or +5 % load weekly when RPE <6.
`;

export const GENERAL_FITNESS_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• 4‑5 d; blend strength (2‑3), HIIT (1), steady cardio (1) + mobility.
• Rest — Compound lifts **90–120 s**; HIIT work:rest 1:1 to 1:2; endurance self‑paced.

PLAN (5 d)
U‑Str DB Bench 3×10 · LPD 3×10 · Plank 3×45 s
HIIT 20 min 30 s on/30 s off any modality
L‑Str Sq 4×8 · RDL 3×10 · KB swing 3×10
Mobility 30 min yoga, easy swim
Endurance 45‑60 min steady bike/jog

PROGRESSION
• Swap HIIT intervals 30/30 → 40/20; Strength +2 % load weekly.
`;

export const GENERAL_FITNESS_ADVANCED_GUIDELINES = `
PRINCIPLES
• Hybrid: heavy strength, HIIT/metcon, long endurance, recovery work.
• Periodise emphasis blocks (e.g., 12 wk marathon → 12 wk strength).
• Rest — Heavy lifts **2–3 min**; metcons as prescribed; endurance self‑paced.

PLAN (6 d)
Day1 Heavy Sq 5×5 · DL 5×3 · BP 5×5
Day2 Metcon (e.g., "Cindy" 20 min AMRAP)
Day3 Mobility + swim 30 min
Day4 Volume Str OHP 4×8 · Pull‑Up 3×12 · Lunge 4×10
Day5 Long run/bike 90‑120 min
Day6 HIIT circuit (sled, KB, burpees) 3 rounds · Day7 Rest

PROGRESSION
• Alternate strength‑heavy / endurance‑heavy cycles; deload every 6 wks.
`;

// ─────────────────────────── MUSCLE GAIN: HYPERTROPHY FOCUS ──────────────────────────
export const MUSCLE_GAIN_HYPERTROPHY_FOCUS_BEGINNER_GUIDELINES = `
PRINCIPLES
• Pure hypertrophy focus: 8–15 reps, muscle failure emphasis (RIR 0‑1).
• 3–4 sessions, higher volume per muscle (12‑16 sets weekly).
• Mechanical tension + metabolic stress; longer TUT (3‑1‑2‑1 tempo).
• Rest — Compounds **90–120 s**; Isolation **60–75 s** (shorter for metabolic stress).

WEEKLY PLAN (4 d Upper/Lower/Upper/Lower)
U1 Incl DB 4×10 · Seated Row 4×12 · Lat Pull 3×12 · Lateral Raise 3×15 · Tri/Bi 3×12 each
L1 Leg Press 4×12 · RDL 3×10 · Walking Lunge 3×12 · Calf Raise 4×15 · Leg Curl 3×12
U2 DB Bench 4×12 · Cable Row 4×10 · OHP 3×10 · Rear Delt Fly 3×15 · Cable Curl 3×12
L2 Goblet Sq 4×15 · Hip Thrust 4×12 · Split Sq 3×12 · Leg Ext 3×15 · Plank 3×45s

PROGRESSION
• Increase reps first (10→12→15), then load. Rest‑pause final set when stuck.

OPTIONS
• 3 d: Full body with 4‑5 exercises. 5 d: Body part split for more isolation volume.
`;

export const MUSCLE_GAIN_HYPERTROPHY_FOCUS_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Advanced hypertrophy techniques: drop sets, rest‑pause, cluster sets (≤15% volume).
• Volume landmarks: Start at MEV (14-16 sets/muscle/week), progress towards MAV (20-24 sets/muscle/week) with hypertrophy specialization. Do not exceed MRV (26 sets/muscle/week).
• Tempo manipulation: 2‑3 s eccentrics, 1‑2 s pause on stretched position.
• Rest — Heavy sets **90–120 s**; isolation/metabolic **45–60 s**.

WEEKLY PLAN (5 d Push/Pull/Legs/Push/Pull)
Push‑A Incl BB 4×8 · DB OHP 4×10 · Dips 3×12 · LR 4×15 · CG Press 3×12
Pull‑A Cable Row 4×8 · Chin 4×6 · Shrug 3×12 · Face Pull 3×15 · Hammer 3×12
Legs‑A Sq 4×10 · RDL 4×8 · Leg Press 3×15 · Curl 3×12 · Calf 4×20
Push‑B DB Bench 4×12 · Arnold Press 3×10 · Cable Fly 3×15 · Tri Ext 4×12
Pull‑B Deadlift 3×6 · T‑Bar Row 4×10 · Cable Curl 4×12 · Rev Fly 3×15

PROGRESSION
• Weekly undulation: Heavy (6‑8) / Moderate (10‑12) / Light (15‑20). Deload wk 4.

OPTIONS
• 4 d: Skip second push or pull. Add intensity techniques on final sets when plateau.
`;

export const MUSCLE_GAIN_HYPERTROPHY_FOCUS_ADVANCED_GUIDELINES = `
PRINCIPLES
• Specialization phases: prioritize 1‑2 muscle groups with 20‑25 sets, maintain others 8‑12.
• Advanced techniques: lengthened partials, mechanical drop sets, cluster training.
• Intra‑workout periodization: strength (5‑8) → hypertrophy (8‑12) → metabolic (15‑20).
• Rest — Strength work **2–3 min**; hypertrophy **60–90 s**; metabolic **30–45 s**.

WEEKLY PLAN (6 d Specialization + PPL)
Push‑Chest Front Sq 3×6 · Incl BB 5×8 · DB Bench 4×10 · Incl Fly 4×15 · Cable Cross 3×20
Pull‑Back DL 4×6 · T‑Bar 5×8 · Cable Row 4×10 · Pullover 4×12 · Cable Curl 3×12
Legs‑Quad Sq 5×8 · Front Sq 4×10 · Leg Press 4×15 · Ext 4×20 · RDL 3×8
Push‑Delt OHP 4×6 · DB Press 4×8 · LR 5×12 · Rear Fly 4×15 · Tri 3×12
Pull‑Arms Chin 4×6 · Cable Row 3×10 · Preacher Curl 5×10 · Hammer 4×12 · 21s 3×
Legs‑Ham RDL 5×8 · SLDL 4×10 · Curl 5×12 · GHR 3×15 · Calf 4×20

PROGRESSION
• 4‑6 wk specialization blocks. Monitor volume landmarks (20+ sets = likely peak).

OPTIONS
• Maintenance phase: 8‑12 sets per muscle. Include cardio 2‑3× for body composition.
`;

// ─────────────────────────── STRENGTH GAIN: POWERLIFTING PEAK ──────────────────────────
export const STRENGTH_GAIN_POWERLIFTING_PEAK_BEGINNER_GUIDELINES = `
PRINCIPLES
• Master SBD (Squat, Bench, Deadlift) technique before max loading.
• 3×5 main lifts @75‑85% with accessories for weak points.
• Competition commands practice; pause bench, competition squat depth.
• Rest — Main lifts **3–5 min**; accessories **2–3 min**; form over speed.

WEEKLY PLAN (3 d A/B/A alternating)
A Sq 3×5 · Bench 3×5 · Row 3×8 · Tricep Ext 3×10
B DL 1×5 · OHP 3×5 · Front Sq 3×8 · Bicep Curl 3×10
A Sq 3×5 · Bench 3×5 · Lat Pull 3×8 · Close Grip 3×8

PROGRESSION
• Linear: +2.5kg session Sq/DL, +1.25kg Bench. Fail twice = deload 10%, rebuild.

OPTIONS
• No equipment: Focus goblet squats, floor press, Romanian deadlifts for technique.
`;

export const STRENGTH_GAIN_POWERLIFTING_PEAK_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Percentage‑based training: 70‑90% main lifts with programmed overload.
• 4 d specialized: separate squat, bench, deadlift focused days + accessory day.
• Competition prep: commands, timing, opener/second/third selection.
• Rest — Competition lifts **3–5 min**; heavy accessories **2–3 min**; isolation **90 s**.

WEEKLY PLAN (4 d SBD + Accessories)
Squat Day Sq 5×3@85% · Front Sq 3×5 · Leg Press 3×10 · Abs 3×15
Bench Day Bench 5×3@85% · CG Bench 3×5 · OHP 3×8 · Tricep 3×12
Dead Day DL 5×3@85% · Deficit DL 3×5 · Row 3×8 · Shrug 3×10
Access Day OHP 4×6 · Pull‑Up 4×8 · Dips 3×10 · Curl 3×12

PROGRESSION
• Weekly +2‑3% on main lifts. Deload every 4 wks (-20% load). Test max every 8‑12 wks.

OPTIONS
• 3 d: Combine deadlift with squat day. Add pause work 2‑3 s on bench/squat.
`;

export const STRENGTH_GAIN_POWERLIFTING_PEAK_ADVANCED_GUIDELINES = `
PRINCIPLES
• Periodized peaking: accumulation (70‑85%) → intensification (85‑95%) → realization (95‑105%).
• Competition simulation: full commands, timing, attempt selection strategy.
• Autoregulation: adjust daily loads based on bar speed, RPE 8‑9 top sets.
• Rest — Openers **2–3 min**; competition attempts **5+ min**; accessories **90–120 s**.

WEEKLY PLAN (5 d Competition Prep)
Mon Sq work to daily 1RM@RPE9 → back‑off 3×3@90%
Tue Bench work to daily 1RM@RPE9 → CG 4×5 → Tricep 3×8
Thu DL work to daily 1RM@RPE9 → Block Pull 3×3 → Row 3×8
Fri Speed Bench 8×3@60%+bands → OHP 4×6 → Accessories
Sat Opener practice all 3 lifts → mobility work

PROGRESSION
• 12‑16 wk peak cycle. Test openers 3 wks out, dress rehearsal 1 wk out.

OPTIONS
• Off‑season: Higher volume (5×5, 4×6) with hypertrophy blocks for muscle building.
`;

// ─────────────────────────── ENDURANCE IMPROVEMENT: GYM CARDIO ──────────────────────────
export const ENDURANCE_IMPROVEMENT_GYM_CARDIO_BEGINNER_GUIDELINES = `
PRINCIPLES
• Machine‑based cardio progression: treadmill, bike, rower, elliptical rotation.
• Start 20‑30 min steady state @RPE 5‑6; build aerobic base first.
• Include 2×/wk strength circuit to maintain muscle mass during fat loss.
• Rest — Cardio: self‑paced; Circuit: **60–90 s** between exercises.

WEEKLY PLAN (4 d)
D1 Treadmill 25 min steady + core circuit 3×15
D2 Recumbent bike 30 min + upper body circuit 2×12
D3 Rest or gentle walk
D4 Elliptical 20 min + full body circuit 3×10
D5 Rower 15 min intervals (2 min easy/1 min mod) × 5

PROGRESSION
• +5 min duration weekly × 3, then add 1 interval or +5% incline/resistance.

OPTIONS
• Home: bodyweight circuits, YouTube cardio, stair climbing, dance workouts.
`;

export const ENDURANCE_IMPROVEMENT_GYM_CARDIO_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Multi‑modal training: HIIT 2×, LISS 2×, strength circuit 1×/wk.
• Target zones: aerobic (65‑75% HRmax), threshold (80‑85%), VO2max (90‑95%).
• Strength maintained with 2 sessions focusing on major movements.
• Rest — HIIT: work:rest 1:1 to 1:2; LISS: conversational pace; strength **90 s**.

WEEKLY PLAN (5 d)
Mon HIIT Bike 30 s hard/30 s easy × 20 + cool down
Tue Strength Sq 3×8 · BP 3×8 · Row 3×8 · Plank 3×30s
Wed LISS Elliptical 45 min Zone 2
Thu HIIT Rower 250m hard/90s easy × 8
Fri Circuit Treadmill 20 min + full body circuit 4 rounds

PROGRESSION
• HIIT: extend intervals 30→45→60s. LISS: +10 min monthly. Strength: +2.5kg/month.

OPTIONS
• 4 d: Skip Friday circuit. Add boxing, spin classes, swimming for variety.
`;

export const ENDURANCE_IMPROVEMENT_GYM_CARDIO_ADVANCED_GUIDELINES = `
PRINCIPLES
• Periodized cardio: base building (70% LISS) → build (50% LISS/50% HIIT) → peak (30% LISS/70% HIIT).
• Cross‑training emphasis: prevent overuse, maintain engagement with variety.
• Strength maintenance: 2 sessions compound movements, minimize volume drop.
• Rest — HIIT: full recovery between sets; Threshold: sustainable discomfort; LISS: nose breathing.

WEEKLY PLAN (6 d Peak Phase)
Mon HIIT Treadmill 4×4 min @85%HRmax · 3 min recovery
Tue Strength DL 4×5 · BP 4×5 · Pull‑Up 3×8 · Core 3×30s
Wed LISS Bike 60 min Zone 2 + rowing 15 min
Thu HIIT Circuit 5 stations: 45s work/15s rest × 6 rounds
Fri Strength Sq 4×5 · OHP 3×8 · Row 3×8 · Glute 3×12
Sat Cross‑train 90 min (swimming, hiking, sport)

PROGRESSION
• 4‑6 wk phases. Monitor HRV, resting HR. Deload every 4th week (−30% volume).

OPTIONS
• Competition prep: sport‑specific intervals. Recovery: active yoga, massage, sauna.
`;

// ─────────────────────────── SPORT-SPECIFIC S&C: EXPLOSIVE POWER ──────────────────────────
export const SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_BEGINNER_GUIDELINES = `
PRINCIPLES
• Foundation: general strength first (8‑12 wks), then add power/speed elements.
• Power development: Olympic lift variations, medicine ball, bodyweight jumps.
• Movement quality over intensity; perfect technique in all explosive movements.
• Rest — Strength **2–3 min**; Power/Speed **full recovery** (2‑4 min); Conditioning **60 s**.

WEEKLY PLAN (3 d)
D1 Foundation Sq 3×8 · BP 3×8 · Row 3×8 · MB Slam 3×5
D2 Power Deadlift 3×5 · Box Jump 3×3 · Med Ball Throw 3×5 · Sprint 4×20m
D3 Integrated Front Sq 3×6 · Push Press 3×6 · Lateral Bound 3×5 · Agility ladder

PROGRESSION
• Master bodyweight jumps → weighted → reactive. Add height/distance gradually.

OPTIONS
• No Olympic bars: DB snatch, KB swing, broad jumps, stair bounds for power.
`;

export const SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Complex training: strength + power pairing (e.g., squat → jump, bench → throw).
• Olympic derivatives: hang clean, push jerk for rapid force development.
• Sport‑specific patterns: rotational, unilateral, multi‑planar movement.
• Rest — Max strength **3–4 min**; Power **3–5 min**; Speed **full recovery**; Conditioning **45–90 s**.

WEEKLY PLAN (4 d)
Power‑L Sq 4×5 + Box Jump 4×3 · RDL 3×5 + Broad Jump 3×3
Power‑U BP 4×5 + Med Ball Throw 4×3 · Row 3×5 + Explosive PU 3×3
Speed 6×40m sprint · Agility drills 15 min · Reactive jump 4×5
Conditioning 5×200m @80% · Bodyweight circuit 3 rounds

PROGRESSION
• Contrast loading: 85% strength → 30% bodyweight power. Monitor jump height.

OPTIONS
• Sport‑specific: add rotational throws, single leg bounds, direction changes.
`;

export const SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_ADVANCED_GUIDELINES = `
PRINCIPLES
• Conjugate method: max effort, dynamic effort, repetition effort in weekly rotation.
• Advanced plyometrics: depth jumps, reactive strength index optimization.
• Periodization: GPP → SPP → Competition phase with power emphasis.
• Rest — Max effort **3–5 min**; Dynamic effort **45–60 s**; Plyometrics **full recovery**.

WEEKLY PLAN (5 d Conjugate)
Max‑L Sq to 1RM@RPE9 · GHR 4×8 · Abs 3×15
Dynamic‑L Speed Sq 10×2@60%+bands · Jump Sq 6×3 · Sprint 6×30m
Max‑U Bench to 1RM@RPE9 · Weighted Dip 4×6 · Row 4×8
Dynamic‑U Speed Bench 10×3@55%+bands · Med Ball 6×3 · Reactive PU 5×3
Conditioning/Recovery Sled drag · Agility · Foam roll · Stretch

PROGRESSION
• Rotate max effort exercises every 2‑3 wks. Monitor countermovement jump.

OPTIONS
• In‑season: maintain with 2‑3 sessions, reduce volume 40%, emphasize speed/power.
`;

// ─────────────────────────── GENERAL FITNESS: FOUNDATIONAL STRENGTH ──────────────────────────
export const GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_BEGINNER_GUIDELINES = `
PRINCIPLES
• Strength‑first approach: master squat, deadlift, press, row patterns.
• 3×5–3×8 rep range for neurological adaptation and muscle coordination.
• Progressive overload with form mastery; avoid ego lifting.
• Rest — Compound lifts **2–3 min**; accessories **90 s**; perfect technique mandatory.

WEEKLY PLAN (3 d A/B alternating)
A Sq 3×5 · BP 3×5 · BB Row 3×5 · Plank 3×30s
B DL 1×5 · OHP 3×5 · Chin‑Up 3×AMAP · Glute Bridge 3×10
A Sq 3×5 · Incl DB 3×8 · Cable Row 3×8 · Side Plank 2×20s

PROGRESSION
• +2.5kg/session when complete all reps. Fail = repeat weight, then deload 10%.

OPTIONS
• DB only: goblet squat, DB press, chest‑supported row, single‑arm variations.
`;

export const GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Periodized strength: linear → undulating → block periodization introduction.
• 4 d upper/lower split with strength focus but muscle balance.
• Include unilateral work for functional strength and injury prevention.
• Rest — Heavy sets **2–3 min**; moderate sets **90 s**; isolation **60 s**.

WEEKLY PLAN (4 d Upper/Lower Heavy/Light)
U‑H Bench 4×5 · Row 4×5 · OHP 3×6 · Pull‑Up 3×8 · Tricep 3×10
L‑H Sq 4×5 · RDL 3×6 · Split Sq 3×8 · Leg Curl 3×10 · Calf 3×12
U‑L Incl DB 3×10 · Cable Row 3×10 · DB OHP 3×10 · Lat Pull 3×12
L‑L Front Sq 3×10 · Hip Thrust 3×10 · Lunge 3×10 · Plank 3×45s

PROGRESSION
• Heavy days: +2.5kg weekly. Light days: +reps then +weight. Deload every 6 wks.

OPTIONS
• 3 d: Full body strength focus. Add cardio 2×/wk for general health.
`;

export const GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_ADVANCED_GUIDELINES = `
PRINCIPLES
• Strength specialization with hypertrophy support; 85‑95% loads 1‑5 rep range.
• Advanced techniques: cluster sets, rest‑pause, accommodating resistance.
• Movement quality assessment and corrective exercises as needed.
• Rest — Max loads **3–5 min**; submaximal **2–3 min**; correctives **60 s**.

WEEKLY PLAN (5 d Strength Focus)
Max Sq 5×3@90% · Front Sq 3×5 · Leg Curl 3×8 · Single Leg RDL 3×6
Max Bench 5×3@90% · Incl DB 3×8 · Row 4×6 · Face Pull 3×12
Max DL 5×3@90% · RDL 3×6 · Pull‑Up 4×6 · Shrug 3×10
OHP Focus 4×5 · CG Bench 3×6 · Lat Pull 3×8 · Tricep 3×10
Accessory Lunge 3×10 · Hip Thrust 3×10 · Curl 3×10 · Core 3×15

PROGRESSION
• 4‑wk strength blocks: +2‑5% weekly, then deload. Periodize with hypertrophy phases.

OPTIONS
• Powerlifting focus: emphasize SBD only. Strongman: add carries, loaded walks.
`;

// ─────────────────────────── WEIGHT LOSS: GYM BASED ──────────────────────────
export const WEIGHT_LOSS_GYM_BASED_BEGINNER_GUIDELINES = `
PRINCIPLES
• Energy expenditure focus: strength training + cardio combination for metabolic boost.
• Circuit training style: minimal rest, compound movements, heart rate elevation.
• Strength preservation during caloric deficit: maintain intensity, reduce volume if needed.
• Rest — Circuit style **30–60 s**; Strength compounds **90 s**; Cardio self‑paced.

WEEKLY PLAN (4 d)
D1 Circuit Sq 3×12 · Push‑Up 3×10 · Row 3×12 · Plank 3×30s (45s rest)
D2 Cardio Treadmill 30 min steady + stretching 10 min
D3 Circuit Deadlift 3×10 · DB Press 3×12 · Lat Pull 3×12 · Lunge 3×10
D4 Cardio Bike intervals: 1 min mod / 1 min easy × 15 + cool down

PROGRESSION
• Cardio: +5 min weekly × 3. Strength: +reps before +weight. Add 5th day.

OPTIONS
• Classes: Zumba, boxing, spin. Home: bodyweight circuits, YouTube workouts.
`;

export const WEIGHT_LOSS_GYM_BASED_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Metabolic conditioning emphasis: supersets, circuits, HIIT integration.
• Strength maintenance: 2‑3 heavy compound days + 2‑3 metabolic days.
• Varied modalities: prevent adaptation, maintain adherence, target different energy systems.
• Rest — Strength **90–120 s**; Metabolic **30–45 s**; HIIT work:rest 1:1 to 1:2.

WEEKLY PLAN (5 d)
Strength Sq 4×8 · Bench 4×8 · Row 4×8 · Core 3×30s
Metcon‑1 5 rounds: 10 burpees, 15 KB swing, 20 mountain climbers
Strength DL 4×8 · OHP 3×8 · Pull‑Up 3×8 · Plank 3×45s
Metcon‑2 EMOM 20 min: 10 air squat, 8 push‑up, 12 sit‑up
Cardio HIIT 30 min treadmill/bike + 15 min stretching

PROGRESSION
• Strength: weekly +2.5kg. Metcon: +1 round monthly or faster times.

OPTIONS
• 4 d: Drop one metcon. Add yoga 1×/wk for recovery and flexibility.
`;

export const WEIGHT_LOSS_GYM_BASED_ADVANCED_GUIDELINES = `
PRINCIPLES
• Periodized fat loss: strength blocks to preserve muscle + metcon blocks for deficit.
• Advanced metabolic training: lactate threshold work, VO2max intervals, strength‑endurance.
• Body composition focus: maintain lean mass while maximizing energy expenditure.
• Rest — Strength work **2–3 min**; Threshold **90–120 s**; VO2max **full recovery**.

WEEKLY PLAN (6 d Metabolic Focus)
Strength‑L Sq 4×6@80% · RDL 3×8 · Lunge 3×10 · Core 3×30s
HIIT‑Bike 8×30s all‑out / 90s easy + 20 min steady
Strength‑U Bench 4×6@80% · Row 4×6 · OHP 3×8 · Pull‑Up 3×8
Metcon 4 rounds: 400m run, 15 thrusters, 15 pull‑ups (for time)
Circuit 45 min: 6 stations × 3 rounds, 45s work/15s rest
Active Recovery 60 min hike/swim + yoga flow

PROGRESSION
• Alternate 4‑wk strength/metcon phases. Monitor body composition monthly.

OPTIONS
• Competition: physique prep with posing practice. Sport: maintain sport‑specific skill.
`;

// ─────────────────────────── BODYWEIGHT MASTERY ──────────────────────────
export const BODYWEIGHT_MASTERY_BEGINNER_GUIDELINES = `
PRINCIPLES
• Progressive calisthenics: master basic patterns before advanced skills.
• Strength‑endurance emphasis: 8‑15 reps focusing on movement quality and control.
• Flexibility integration: active mobility for skill prerequisites (handstand, pistol squat).
• Rest — Skill work **full recovery**; Strength **60–90 s**; Flexibility self‑paced.

WEEKLY PLAN (3 d)
D1 Push‑Up 3×8 · Squat 3×15 · Pike Push‑Up 3×5 · Hollow Hold 3×20s
D2 Pull‑Up Progression 3×AMAP · Lunge 3×10 · Dip Progression 3×5 · Plank 3×30s
D3 Incl Push‑Up 3×10 · Pistol Progression 3×5 · Handstand Progression 3×30s

PROGRESSION
• Master full ROM → add reps → progress to harder variation. Video form checks.

OPTIONS
• Equipment: resistance bands for assistance. Playground: monkey bars, parallel bars.
`;

export const BODYWEIGHT_MASTERY_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Advanced progressions: one‑arm push‑up, pistol squat, muscle‑up development.
• Skill‑strength combination: hold positions (handstand, L‑sit) + dynamic movements.
• Unilateral focus: single‑limb strength and coordination challenges.
• Rest — Skill practice **2–3 min**; Strength work **90 s**; Static holds brief rest.

WEEKLY PLAN (4 d)
Upper Push Archer Push‑Up 3×6 · Pike PU 4×8 · Tricep Dip 3×10 · Handstand 3×45s
Upper Pull Chin‑Up 4×8 · L‑Sit Progression 3×15s · Inverted Row 3×10
Lower Pistol Sq 3×5 · Shrimp Sq Progression 3×3 · Single Leg Calf 3×15
Full Flow 20 min: burpees, mountain climbers, bear crawl, crab walk

PROGRESSION
• Skills: +5‑10s holds weekly. Strength: harder progressions every 4‑6 wks.

OPTIONS
• Rings: add instability. Outdoors: tree climbing, rock hopping, natural movements.
`;

export const BODYWEIGHT_MASTERY_ADVANCED_GUIDELINES = `
PRINCIPLES
• Elite skills: planche, front lever, human flag, one‑arm chin‑up progressions.
• Strength‑skill periodization: strength blocks → skill acquisition → integration.
• Movement flow: combine strength, flexibility, coordination in creative sequences.
• Rest — Max effort skills **3–5 min**; Flow practice **60 s**; Flexibility continuous.

WEEKLY PLAN (5 d Elite Skills)
Planche Planche Lean 5×20s · Tuck Planche 3×10s · Push‑Up Variations 3×8
Front Lever FL Progression 5×10s · Weighted Pull‑Up 4×5 · Muscle‑Up 3×3
Lower Flow Pistol Sq 3×8 · Jump Sq 4×8 · Single Leg DL 3×8 · Calf Jump 3×10
Upper Power Explosive Push‑Up 4×5 · Clap Pull‑Up 3×3 · Handstand PU 3×3
Integration 30 min flow: combine all elements in creative movement sequences

PROGRESSION
• Skill holds: +2‑5s weekly. Power: +reps or height/distance. Flow: complexity.

OPTIONS
• Competition: freestyle calisthenics. Teaching: break down progressions for others.
`;

// ─────────────────────────── RECOMPOSITION: LEAN MASS & FAT LOSS ──────────────────────────
export const RECOMPOSITION_LEAN_MASS_FAT_LOSS_BEGINNER_GUIDELINES = `
PRINCIPLES
• Body recomposition: simultaneous muscle gain and fat loss through strength + cardio.
• Higher protein intake (1.8‑2.2g/kg) with moderate caloric deficit (200‑300 kcal).
• Strength training priority: progressive overload for muscle preservation/growth.
• Rest — Strength **90–120 s**; Cardio steady pace; Circuits **60 s** for metabolic benefit.

WEEKLY PLAN (4 d)
Strength‑U Bench 3×8 · Row 3×8 · OHP 3×10 · Lat Pull 3×10 · Bicep/Tricep 2×12
Cardio LISS 30 min + core circuit 3×15
Strength‑L Sq 3×8 · RDL 3×8 · Lunge 3×10 · Leg Curl 3×10 · Calf 3×15
Circuit 3 rounds: KB swing, push‑up, squat, plank (45s work/15s rest)

PROGRESSION
• Strength: +2.5kg when completing all reps. Cardio: +5 min every 2 wks.

OPTIONS
• Home: DB workouts + bodyweight circuits. Track body composition weekly.
`;

export const RECOMPOSITION_LEAN_MASS_FAT_LOSS_INTERMEDIATE_GUIDELINES = `
PRINCIPLES
• Periodized recomp: strength phases (slight surplus) alternate with cut phases (deficit).
• Strategic cardio timing: post‑workout or separate sessions to preserve strength.
• Advanced techniques: supersets, drop sets (≤10% volume) for metabolic stress.
• Rest — Heavy compounds **2–3 min**; Supersets **90 s**; HIIT work:rest 1:1.

WEEKLY PLAN (5 d)
Heavy Upper Bench 4×6 · Row 4×6 · OHP 3×8 · Weighted Chin 3×6
HIIT Cardio 20 min bike intervals + abs 3×20
Heavy Lower Sq 4×6 · RDL 4×6 · Bulgarian SS 3×8 · Leg Curl 3×10
Volume Upper Incl DB 4×10 SS Lat Pull 4×10 · OHP 3×12 SS Face Pull 3×15
Metabolic 35 min: strength circuit + 15 min steady cardio

PROGRESSION
• Heavy days: +2.5kg/2 wks. Volume days: +reps then weight. Reassess every 6 wks.

OPTIONS
• 4 d: combine heavy upper/lower days. Add yoga or walking on off days.
`;

export const RECOMPOSITION_LEAN_MASS_FAT_LOSS_ADVANCED_GUIDELINES = `
PRINCIPLES
• Advanced periodization: mini cut/lean gain cycles (6‑12 wk phases).
• Precision tracking: body composition, performance metrics, recovery markers.
• Strategic depletion/refeed: enhance fat oxidation while maintaining muscle.
• Rest — Max effort **3–5 min**; Volume work **90–120 s**; Metabolic **30–60 s**.

WEEKLY PLAN (6 d Specialized Recomp)
Power‑Strength Sq 5×3@90% · Bench 5×3@90% · Row 4×6 · Core 3×30s
Hypertrophy‑U Incl DB 4×10 · Cable Row 4×10 · Lateral Raise 4×15 · Superset arms
HIIT Metcon 25 min: complex movements for time + 20 min Zone 2 cardio
Hypertrophy‑L Front Sq 4×10 · Hip Thrust 4×10 · Leg Curl 4×12 · Calf 4×20
Power‑Cardio Explosive movements 4×5 + 30 min steady state
Recovery/Assess Mobility work + body composition + planning next phase

PROGRESSION
• 8‑wk phases: strength/muscle focus → metabolic/fat focus. Adjust macros accordingly.

OPTIONS
• Contest prep: add posing, tanning. Photo shoots: peak timing with carb cycling.
`;

export const NEURAL_COACHING_CUES = `
- **Squat**: "Drive through your mid-foot and keep your chest up."
- **Bench Press**: "Maintain a stable arch and drive your feet into the floor."
- **Deadlift**: "Keep the bar close to your body and maintain a neutral spine."
- **Overhead Press**: "Brace your core and glutes to create a stable base."
- **Rows**: "Initiate the pull with your back, not your arms; squeeze your shoulder blades."
- **RDLs**: "Think of pushing your hips back, keeping a soft bend in the knees."
- **Hypertrophy Focus**: "Control the eccentric (lowering) phase for 2-3 seconds."
- **Strength Focus**: "Focus on explosive, powerful concentric (lifting) phases."
`;