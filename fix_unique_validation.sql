-- Migration: Add Unique Constraints for Data Integrity
-- Jalankan kode ini di SQL Editor Supabase Anda

-- 1. Unik untuk Jurusan (Nama atau Kode tidak boleh sama dalam satu sekolah)
ALTER TABLE public.majors ADD CONSTRAINT unique_major_name_per_school UNIQUE (school_id, name);
ALTER TABLE public.majors ADD CONSTRAINT unique_major_code_per_school UNIQUE (school_id, code);

-- 2. Unik untuk Kelas (Nama, Tingkat, Sekolah, dan Jurusan tidak boleh sama persis)
ALTER TABLE public.classes ADD CONSTRAINT unique_class_composite UNIQUE (school_id, major_id, level, name);

-- 3. Unik untuk Mata Pelajaran (Nama atau Kode tidak boleh sama dalam satu sekolah)
ALTER TABLE public.subjects ADD CONSTRAINT unique_subject_name_per_school UNIQUE (school_id, name);
ALTER TABLE public.subjects ADD CONSTRAINT unique_subject_code_per_school UNIQUE (school_id, code);
