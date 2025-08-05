-- Migration to allow null values in weak_point_analysis column
ALTER TABLE public.training_programs ALTER COLUMN weak_point_analysis DROP NOT NULL;
