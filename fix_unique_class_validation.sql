-- SQL untuk Validasi Duplikat Kelas
-- Menambahkan Unique Constraint agar tidak ada data kelas yang sama persis

-- 1. Hapus data duplikat jika ada (opsional, agar constraint bisa dipasang)
-- (Ini hanya tindakan pencegahan)

-- 2. Tambahkan UNIQUE Constraint
-- Kriteria: Sekolah + Jurusan + Tingkat + Nama Kelas harus unik
ALTER TABLE public.classes 
ADD CONSTRAINT unique_class_entry 
UNIQUE (school_id, major_id, level, name);

-- Jika terjadi error saat menjalankan ini, berarti ada data yang sudah duplikat.
-- Silakan hapus salah satu data duplikat secara manual di tabel 'classes'.
