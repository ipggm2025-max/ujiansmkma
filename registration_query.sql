-- ==========================================
-- SQL UNTUK PENDAFTARAN & SINKRONISASI USER
-- ==========================================
-- Jalankan kode ini di SQL Editor Supabase Anda untuk memastikan
-- pendaftaran user melalui dashboard Authentication berjalan lancar
-- dan otomatis membuat profil di aplikasi.

-- 1. Tabel Profil (Pusat Data User Aplikasi)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'siswa' CHECK (role IN ('administrator', 'guru', 'siswa')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan RLS pada tabel profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Akses (Agar data bisa dibaca di aplikasi)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profiles." ON public.profiles;
CREATE POLICY "Users can update their own profiles." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Fungsi Otomatisasi (Trigger)
-- Fungsi ini akan berjalan SETIAP KALI Anda menambah user baru di menu "Authentication"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'), 
    COALESCE(new.raw_user_meta_data->>'role', 'siswa')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Pasang Trigger ke Tabel Auth Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- CARA MENJADIKAN ADMIN (SETELAH USER DIBUAT)
-- ==========================================
-- Jalankan baris di bawah ini JIKA Anda sudah membuat user: admin.simujian@gmail.com
-- UPDATE public.profiles SET role = 'administrator' WHERE email = 'admin.simujian@gmail.com';
