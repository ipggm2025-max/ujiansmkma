-- SQL untuk memperbaiki masalah simpan data Master
-- Jalankan kode ini di SQL Editor Supabase Anda

-- 1. Matikan RLS sementara (opsional, jika ingin cepat) atau tambahkan POLICY
-- Di sini kita tambahkan POLICY yang memperbolehkan user login untuk modifikasi data

-- Tabel Schools
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.schools;
CREATE POLICY "Allow all for authenticated" ON public.schools 
FOR ALL USING (auth.role() = 'authenticated');

-- Tabel Majors
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.majors;
CREATE POLICY "Allow all for authenticated" ON public.majors 
FOR ALL USING (auth.role() = 'authenticated');

-- Tabel Classes
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.classes;
CREATE POLICY "Allow all for authenticated" ON public.classes 
FOR ALL USING (auth.role() = 'authenticated');

-- Tabel Subjects
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.subjects;
CREATE POLICY "Allow all for authenticated" ON public.subjects 
FOR ALL USING (auth.role() = 'authenticated');

-- Pastikan tabel-tabel ini dapat diakses oleh user yang login
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
