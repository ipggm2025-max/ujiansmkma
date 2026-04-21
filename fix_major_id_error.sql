-- SOLUSI ERROR: 'major_id' column not found
-- Jalankan kode ini di SQL Editor Supabase Anda

-- 1. Buat tabel 'majors' jika belum ada (karena di init_db.sql tadi belum ada)
CREATE TABLE IF NOT EXISTS public.majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tambahkan kolom 'major_id' ke tabel 'classes'
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL;

-- 3. Tambahkan kolom 'code' ke tabel 'subjects' (diperlukan oleh UI)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS code TEXT;

-- 4. Update Policy RLS untuk tabel Majors (agar bisa disimpan)
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.majors;
CREATE POLICY "Allow all for authenticated" ON public.majors 
FOR ALL USING (auth.role() = 'authenticated');

-- 5. Refresh skema cache (opsional, Supabase biasanya otomatis)
-- Namun menjalankan ini memastikan kolom baru terdeteksi
NOTIFY pgrst, 'reload schema';
