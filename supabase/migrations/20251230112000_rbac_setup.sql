-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add user_id to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indicator function for admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for articles
DROP POLICY IF EXISTS "Authenticated users can update articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can delete articles" ON public.articles;

CREATE POLICY "Owners and admins can update articles"
ON public.articles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Owners and admins can delete articles"
ON public.articles FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());
