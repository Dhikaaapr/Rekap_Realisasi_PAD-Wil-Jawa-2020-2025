-- ====================================================
-- 🔐 SETUP AUTH ADMIN PER WILAYAH
-- ====================================================
-- Jalankan SQL ini di Supabase SQL Editor
-- ====================================================

-- 1. Buat Tabel Akun
CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Plain text untuk simplicity (bisa dihash nanti)
  daerah VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan RLS
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Baca (Supaya bisa dicek saat login)
DROP POLICY IF EXISTS "Anyone can check credentials" ON admin_accounts;
CREATE POLICY "Anyone can check credentials" ON admin_accounts 
  FOR SELECT USING (true);

-- 4. Kebijakan Insert (Izin buat robot kita masukin data)
DROP POLICY IF EXISTS "Anyone can insert accounts" ON admin_accounts;
CREATE POLICY "Anyone can insert accounts" ON admin_accounts 
  FOR INSERT WITH CHECK (true);

-- 5. Kebijakan Update (Admin sendiri mungkin mau ganti password nanti)
DROP POLICY IF EXISTS "Users can update own account" ON admin_accounts;
CREATE POLICY "Users can update own account" ON admin_accounts 
  FOR UPDATE USING (true); -- Bisa diperketat dengan auth.uid() jika pakai Supabase Auth 

-- COMMENT
COMMENT ON TABLE admin_accounts IS 'Daftar akun admin per wilayah untuk portal LRA';
