-- Update Profiles to include NISN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nisn TEXT UNIQUE;
