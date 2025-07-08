-- Migration: Create e1RM calculation function using Brzycki formula
-- Created: 2025-01-08 13:02:12
-- Description: Implements the Brzycki formula for estimating 1-rep max from weight and reps

-- Create the e1RM calculation function
CREATE OR REPLACE FUNCTION calculate_e1rm(weight_lifted NUMERIC, reps_done INT)
RETURNS NUMERIC AS $$
DECLARE
    capped_reps INT;
    denominator NUMERIC;
    e1rm_result NUMERIC;
BEGIN
    -- Input validation
    IF weight_lifted <= 0 THEN
        RAISE EXCEPTION 'Weight must be greater than 0';
    END IF;
    
    IF reps_done <= 0 THEN
        RAISE EXCEPTION 'Repetitions must be greater than 0';
    END IF;
    
    -- If already 1 rep, return the weight (actual 1RM)
    IF reps_done = 1 THEN
        RETURN weight_lifted;
    END IF;
    
    -- Cap repetitions at 12 for reliability
    -- The Brzycki formula becomes less accurate beyond 12 reps
    capped_reps := LEAST(reps_done, 12);
    
    -- Brzycki formula: weight / (1.0278 - 0.0278 * reps)
    denominator := 1.0278 - (0.0278 * capped_reps);
    
    -- Safety check to prevent division by zero or negative denominators
    IF denominator <= 0 THEN
        -- This should theoretically never happen with capped reps, but safety first
        RETURN weight_lifted * 1.5; -- Conservative fallback
    END IF;
    
    -- Calculate e1RM using Brzycki formula
    e1rm_result := weight_lifted / denominator;
    
    -- Round to 1 decimal place for practical use
    RETURN ROUND(e1rm_result, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create helper function to determine confidence level based on reps
CREATE OR REPLACE FUNCTION get_e1rm_confidence(reps_done INT)
RETURNS TEXT AS $$
BEGIN
    IF reps_done >= 1 AND reps_done <= 3 THEN
        RETURN 'high';    -- Very reliable for low reps
    ELSIF reps_done >= 4 AND reps_done <= 8 THEN
        RETURN 'medium';  -- Good reliability for moderate reps
    ELSE
        RETURN 'low';     -- Less reliable for high reps (9-12+)
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to validate if workout data is suitable for e1RM calculation
CREATE OR REPLACE FUNCTION is_valid_for_e1rm(weight_lifted NUMERIC, reps_done INT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN weight_lifted > 0 AND reps_done > 0 AND reps_done <= 20;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create comprehensive e1RM calculation function that returns both value and confidence
CREATE OR REPLACE FUNCTION calculate_e1rm_with_confidence(weight_lifted NUMERIC, reps_done INT)
RETURNS JSON AS $$
DECLARE
    e1rm_value NUMERIC;
    confidence_level TEXT;
BEGIN
    -- Validate input
    IF NOT is_valid_for_e1rm(weight_lifted, reps_done) THEN
        RETURN json_build_object(
            'e1rm', NULL,
            'confidence', NULL,
            'valid', false,
            'error', 'Invalid weight or rep count'
        );
    END IF;
    
    -- Calculate e1RM
    e1rm_value := calculate_e1rm(weight_lifted, reps_done);
    confidence_level := get_e1rm_confidence(reps_done);
    
    RETURN json_build_object(
        'e1rm', e1rm_value,
        'confidence', confidence_level,
        'valid', true,
        'source', json_build_object(
            'weight', weight_lifted,
            'reps', reps_done
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_e1rm(NUMERIC, INT) IS 'Calculate estimated 1-rep max using the Brzycki formula: weight / (1.0278 - 0.0278 * reps)';
COMMENT ON FUNCTION get_e1rm_confidence(INT) IS 'Determine confidence level (high/medium/low) based on repetition count';
COMMENT ON FUNCTION is_valid_for_e1rm(NUMERIC, INT) IS 'Validate if workout data is suitable for e1RM calculation';
COMMENT ON FUNCTION calculate_e1rm_with_confidence(NUMERIC, INT) IS 'Calculate e1RM with confidence level and validation, returns JSON object';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_e1rm(NUMERIC, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_e1rm_confidence(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_for_e1rm(NUMERIC, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_e1rm_with_confidence(NUMERIC, INT) TO authenticated; 