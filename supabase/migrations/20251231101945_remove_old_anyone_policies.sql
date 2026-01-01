-- Migration: Remove old "Anyone can..." policies that conflict with new RLS policies

-- Drop the old "Anyone can..." policies from the initial migration
-- These policies allow anyone (even unauthenticated users) to create/update/delete articles
-- which conflicts with our new user-based RLS policies

DROP POLICY IF EXISTS "Anyone can create articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can update articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can delete articles" ON public.articles;

-- Note: We keep "Anyone can view articles" for public read access (SELECT policy)


