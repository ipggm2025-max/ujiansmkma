-- Fix RLS for Profiles table to allow Administrators to manage users
-- Run this in Supabase SQL Editor

-- 1. Ensure columns exist (just in case they were missed)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nisn TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles." ON public.profiles;

-- 3. Create comprehensive policies
-- Everyone can see profiles (required for various lookups)
CREATE POLICY "Enable read access for all" ON public.profiles
    FOR SELECT USING (true);

-- Users can update their own profile (basic self-service)
CREATE POLICY "Enable update for users own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Administrators can do EVERYTHING (INSERT, UPDATE, DELETE)
-- We check the 'role' column in the profiles table for the current user
CREATE POLICY "Enable all access for administrators" ON public.profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'administrator'
        )
    );

-- Also allow Administrators to delete profiles
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'administrator'
        )
    );

-- 4. Unique composite key for bulk updates (Optional but good practice)
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_email UNIQUE (email);
