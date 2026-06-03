-- Migration: Add missing setting, theme, and daily intention columns to users table

-- 1. Add wallpaper theme column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallpaper_theme text DEFAULT 'system';

-- 2. Add quiet mode focus columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS quiet_mode_enabled boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS quiet_mode_start text DEFAULT '22:00';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS quiet_mode_end text DEFAULT '07:00';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS quiet_mode_auto_reply text DEFAULT 'Practicing quiet focus. Messages will be read mindfully.';

-- 3. Add focus intention columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS intention_text text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS intention_expires_at timestamp with time zone;
