-- Migration: Update expenses table for CSV Import compatibility
-- Adds property_name and category columns

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS property_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update RLS policies (just in case, but existing ones should cover these columns)
NOTIFY pgrst, 'reload config';
