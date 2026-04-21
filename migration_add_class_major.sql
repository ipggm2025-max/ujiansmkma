-- Migration: Add Class and Major to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL;

-- Refresh view for profiles to include joins
-- (Optional: Profiles RLS usually handles simple columns automatically)
