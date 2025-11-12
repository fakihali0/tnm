-- Add terms acceptance tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying users who haven't accepted terms
CREATE INDEX idx_profiles_terms_accepted 
ON public.profiles(terms_accepted_at);

-- Add comment
COMMENT ON COLUMN public.profiles.terms_accepted_at 
IS 'Timestamp when user accepted terms and conditions';