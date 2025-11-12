-- Create partner_applications table with comprehensive fields
CREATE TABLE public.partner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    country TEXT,
    partner_type TEXT NOT NULL CHECK (partner_type IN ('affiliate', 'ib', 'regional')),
    experience TEXT,
    goals TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on partner_applications
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit partner applications
CREATE POLICY "Anyone can submit partner applications" 
ON public.partner_applications 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view partner applications
CREATE POLICY "Only admins can view partner applications" 
ON public.partner_applications 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for partner_applications timestamps
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_partner_applications_created_at ON public.partner_applications(created_at DESC);
CREATE INDEX idx_partner_applications_partner_type ON public.partner_applications(partner_type);