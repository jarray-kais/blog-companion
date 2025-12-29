-- Create articles table for blog management
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  auteur TEXT NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read articles (public blog)
CREATE POLICY "Anyone can view articles" 
ON public.articles 
FOR SELECT 
USING (true);

-- Allow anyone to create articles (for demo purposes - in production you'd want auth)
CREATE POLICY "Anyone can create articles" 
ON public.articles 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update articles (for demo)
CREATE POLICY "Anyone can update articles" 
ON public.articles 
FOR UPDATE 
USING (true);

-- Allow anyone to delete articles (for demo)
CREATE POLICY "Anyone can delete articles" 
ON public.articles 
FOR DELETE 
USING (true);