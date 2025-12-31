-- Migration: Add user management and RLS policies
-- This migration adds userId to articles, role to profiles, and implements RLS policies

-- ============================================
-- 1. Add role column to profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add constraint to ensure role is either 'user' or 'admin'
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin'));

-- Create index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- 2. Update handle_new_user function to include role
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 'user');
  RETURN new;
END;
$$;

-- ============================================
-- 3. Add user_id column to articles table
-- ============================================
-- First, add the column as nullable (to handle existing articles)
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON public.articles(user_id);

-- Note: For existing articles without user_id, they will be nullable.
-- You may want to manually assign them to users or delete them.
-- To make user_id required for new articles, you can add NOT NULL constraint later:
-- ALTER TABLE public.articles ALTER COLUMN user_id SET NOT NULL;

-- ============================================
-- 4. Drop old article RLS policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can update articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can delete articles" ON public.articles;

-- ============================================
-- 5. Create new RLS policies for articles
-- ============================================

-- INSERT: Users can only insert articles with their own user_id
CREATE POLICY "Users can insert their own articles"
ON public.articles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own articles OR admins can update any article
CREATE POLICY "Users can update their own articles or admins can update any"
ON public.articles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Users can delete their own articles OR admins can delete any article
CREATE POLICY "Users can delete their own articles or admins can delete any"
ON public.articles
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Note: SELECT policy "Anyone can view articles" remains unchanged (public read access)

