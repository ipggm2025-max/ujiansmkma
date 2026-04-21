-- Create table for application settings
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name text NOT NULL DEFAULT 'SIM-UJIAN',
    app_version text NOT NULL DEFAULT 'v2.4',
    app_description text DEFAULT 'Advanced Infrastructure Protocol for Examination Management',
    logo_text text DEFAULT 'S',
    institution_name text DEFAULT 'SMKN 1 KOTA',
    copyright_text text DEFAULT 'SIM-UJIAN CORE',
    footer_info text DEFAULT 'Secure Enterprise Node',
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Allow public read access" ON public.settings
    FOR SELECT USING (true);

-- Only authenticated users (admins) can update settings
-- Since we use a simple administrator role, we'll check the profiles table or metadata
-- For this setup, we'll allow authenticated users to update for convenience in this environment, 
-- but in production you'd restrict this to specific UIDs or roles.
CREATE POLICY "Allow authenticated update" ON public.settings
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON public.settings
    FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default settings if none exist
INSERT INTO public.settings (app_name, app_version, app_description, logo_text, institution_name, copyright_text, footer_info)
SELECT 'SIM-UJIAN', 'v2.4', 'Advanced Infrastructure Protocol for Examination Management', 'S', 'SMKN 1 KOTA', 'SIM-UJIAN CORE', 'Secure Enterprise Node'
WHERE NOT EXISTS (SELECT 1 FROM public.settings);
