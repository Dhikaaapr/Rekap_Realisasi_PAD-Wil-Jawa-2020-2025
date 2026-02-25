-- ====================================================
-- 🗃️ SUPABASE TABLE SETUP - Rekap PAD Wilayah Jawa
-- ====================================================
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ====================================================

-- ====================================
-- TABLE: pad_data
-- Data Pendapatan Asli Daerah per wilayah per tahun
-- ====================================
CREATE TABLE IF NOT EXISTS pad_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tahun INTEGER NOT NULL,
  nomor_urut VARCHAR(10) DEFAULT '',
  daerah VARCHAR(255) NOT NULL,
  pajak_anggaran DOUBLE PRECISION DEFAULT 0,
  pajak_realisasi DOUBLE PRECISION DEFAULT 0,
  retribusi_anggaran DOUBLE PRECISION DEFAULT 0,
  retribusi_realisasi DOUBLE PRECISION DEFAULT 0,
  pengelolaan_anggaran DOUBLE PRECISION DEFAULT 0,
  pengelolaan_realisasi DOUBLE PRECISION DEFAULT 0,
  lain_pad_anggaran DOUBLE PRECISION DEFAULT 0,
  lain_pad_realisasi DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_pad_data_tahun ON pad_data(tahun);
CREATE INDEX IF NOT EXISTS idx_pad_data_daerah ON pad_data(daerah);
CREATE INDEX IF NOT EXISTS idx_pad_data_tahun_daerah ON pad_data(tahun, daerah);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pad_data_updated_at
  BEFORE UPDATE ON pad_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Komentar tabel
COMMENT ON TABLE pad_data IS 'Data Pendapatan Asli Daerah per wilayah per tahun (2021-2025)';
COMMENT ON COLUMN pad_data.tahun IS 'Tahun anggaran (2021-2025)';
COMMENT ON COLUMN pad_data.nomor_urut IS 'Nomor urut daerah (XI, XII, 1, 2, dst)';
COMMENT ON COLUMN pad_data.daerah IS 'Nama daerah (contoh: Prov. DKI Jakarta, Kab. Bogor)';
COMMENT ON COLUMN pad_data.pajak_anggaran IS 'Anggaran Pajak Daerah';
COMMENT ON COLUMN pad_data.pajak_realisasi IS 'Realisasi Pajak Daerah';
COMMENT ON COLUMN pad_data.retribusi_anggaran IS 'Anggaran Retribusi Daerah';
COMMENT ON COLUMN pad_data.retribusi_realisasi IS 'Realisasi Retribusi Daerah';
COMMENT ON COLUMN pad_data.pengelolaan_anggaran IS 'Anggaran Pengelolaan Kekayaan Daerah';
COMMENT ON COLUMN pad_data.pengelolaan_realisasi IS 'Realisasi Pengelolaan Kekayaan Daerah';
COMMENT ON COLUMN pad_data.lain_pad_anggaran IS 'Anggaran Lain-lain PAD yang Sah';
COMMENT ON COLUMN pad_data.lain_pad_realisasi IS 'Realisasi Lain-lain PAD yang Sah';

-- ====================================
-- TABLE: profiles (Extended user data)
-- ====================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: Auto-create profile saat user register
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS
ALTER TABLE pad_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PAD Data Policies
-- Everyone can read (public dashboard)
CREATE POLICY "Anyone can read pad_data" ON pad_data
  FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert pad_data" ON pad_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update pad_data" ON pad_data
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete pad_data" ON pad_data
  FOR DELETE USING (auth.role() = 'authenticated');

-- Profile Policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ====================================
-- ✅ DONE!
-- ====================================
-- Setelah menjalankan SQL ini, tabel siap diisi data.
-- Lanjutkan dengan menjalankan script import_to_supabase.py
