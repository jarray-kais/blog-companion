-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update articles RLS: only authenticated users can create/update/delete
DROP POLICY IF EXISTS "Allow all inserts" ON public.articles;
DROP POLICY IF EXISTS "Allow all updates" ON public.articles;
DROP POLICY IF EXISTS "Allow all deletes" ON public.articles;

-- New policies for authenticated users only
CREATE POLICY "Authenticated users can insert articles"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
ON public.articles FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete articles"
ON public.articles FOR DELETE
TO authenticated
USING (true);