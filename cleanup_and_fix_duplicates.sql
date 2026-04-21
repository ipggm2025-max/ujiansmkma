-- SOLUSI ERROR: Pembersihan Data Duplikat & Pemasangan Validasi Unik
-- Jalankan kode ini di SQL Editor Supabase Anda

-- 1. Hapus data 'classes' yang duplikat
-- Kita akan menyimpan satu data per grup dan menghapus sisanya
DELETE FROM public.classes a
USING public.classes b
WHERE a.id > b.id 
  AND a.school_id = b.school_id 
  AND a.major_id = b.major_id 
  AND a.level = b.level 
  AND a.name = b.name;

-- 2. Setelah data bersih, baru kita pasang UNIQUE CONSTRAINT
-- Sekarang perintah ini pasti berhasil karena data sudah unik
ALTER TABLE public.classes 
ADD CONSTRAINT unique_class_entry 
UNIQUE (school_id, major_id, level, name);

-- 3. Verifikasi: Beritahu Supabase untuk reload schema cache
NOTIFY pgrst, 'reload schema';
