-- ==========================================
-- FINAL SCHEMA FIX & CACHE RELOAD
-- Run this if you see "Could not find column in schema cache"
-- ==========================================

-- 1. Ensure columns exist (using ALTER instead of CREATE TABLE IF NOT EXISTS)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS property_name TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Force a schema cache reload for PostgREST (Supabase API)
-- This tells the API to re-scan the tables for new columns.
NOTIFY pgrst, 'reload config';

-- 3. (Optional) Troubleshooting Tip:
-- If the error persists, go to your Supabase Dashboard:
-- 1. Settings -> API -> PostgREST Settings
-- 2. Click "Reload Schema" manually.
