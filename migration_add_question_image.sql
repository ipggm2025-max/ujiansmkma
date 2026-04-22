-- Migration: Add image_url to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Seed some question banks if they don't exist
-- This is helpful for testing since we need a question_bank_id to link questions to
INSERT INTO public.question_banks (id, title, description)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Bank Soal Umum', 'Kumpulan soal pengetahuan umum')
ON CONFLICT (id) DO NOTHING;
