-- Migration for Master Data
-- Jalankan kode ini di SQL Editor Supabase Anda

-- 1. Tabel Schools (Sudah ada di init_db.sql tapi kita pastikan lagi)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Jurusan (Majors)
CREATE TABLE IF NOT EXISTS public.majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Kelas (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    major_id UUID REFERENCES public.majors(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    level INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Mata Pelajaran (Subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
