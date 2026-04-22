-- Migration: Add RLS Policies for Question Bank and Questions
-- Allowing authenticated users to manage data for development

-- Question Banks Policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.question_banks;
CREATE POLICY "Allow all for authenticated" ON public.question_banks
    FOR ALL USING (auth.role() = 'authenticated');

-- Questions Policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.questions;
CREATE POLICY "Allow all for authenticated" ON public.questions
    FOR ALL USING (auth.role() = 'authenticated');

-- Exams Policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.exams;
CREATE POLICY "Allow all for authenticated" ON public.exams
    FOR ALL USING (auth.role() = 'authenticated');

-- Exam Participants Policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.exam_participants;
CREATE POLICY "Allow all for authenticated" ON public.exam_participants
    FOR ALL USING (auth.role() = 'authenticated');

-- Exam Submissions Policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.exam_submissions;
CREATE POLICY "Allow all for authenticated" ON public.exam_submissions
    FOR ALL USING (auth.role() = 'authenticated');

-- Ensure Storage Buckets exist (Manual check: create bucket 'assets' via dashboard if this fails)
-- Note: SQL cannot easily create buckets in Supabase without using storage schema functions
-- but we can ensure policies are there
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'assets' );
