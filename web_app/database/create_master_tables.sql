-- ====================================
-- 1. DROP OLD TABLES (IF EXIST)
-- ====================================
DROP TABLE IF EXISTS detail_pad_data CASCADE;
DROP TABLE IF EXISTS ref_kategori_pad CASCADE;

-- ================================================================
-- 🏛️ MASTER DATA / REFERENSI KATEGORI PAD
-- ================================================================
-- Berdasarkan UU HKPD (Hubungan Keuangan Pusat & Daerah)

-- ====================================
-- TABLE: ref_kategori_pad
-- Tabel hierarki semua jenis PAD (pajak, retribusi, dll)
-- ====================================
CREATE TABLE IF NOT EXISTS ref_kategori_pad (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,          -- Kode unik (misal: PAJ-PROV-PKB)
  nama VARCHAR(255) NOT NULL,                -- Nama kategori
  nama_lengkap TEXT,                         -- Nama lengkap/deskripsi
  kategori_utama VARCHAR(50) NOT NULL,       -- 'pajak', 'retribusi', 'pengelolaan', 'lain_pad'
  sub_kategori VARCHAR(100),                 -- Sub-kategori (misal: 'pajak_provinsi', 'retribusi_jasa_umum')
  tingkat_pemerintahan VARCHAR(20),          -- 'provinsi', 'kabupaten_kota', 'semua'
  parent_kode VARCHAR(50) REFERENCES ref_kategori_pad(kode), -- Hierarki parent
  level INTEGER DEFAULT 1,                   -- Level hierarki (1=utama, 2=sub, 3=detail)
  dasar_hukum VARCHAR(100),                  -- Dasar hukum (misal: 'Pasal 87 UU HKPD')
  urutan INTEGER DEFAULT 0,                  -- Urutan tampilan
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ref_kategori_utama ON ref_kategori_pad(kategori_utama);
CREATE INDEX IF NOT EXISTS idx_ref_sub_kategori ON ref_kategori_pad(sub_kategori);
CREATE INDEX IF NOT EXISTS idx_ref_parent_kode ON ref_kategori_pad(parent_kode);
CREATE INDEX IF NOT EXISTS idx_ref_tingkat ON ref_kategori_pad(tingkat_pemerintahan);

-- ================================================================
-- 📊 SEED DATA: KATEGORI UTAMA PAD (Level 1)
-- ================================================================
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, urutan) VALUES
-- 4 Komponen utama PAD
('PAD-PAJAK',       'Pajak Daerah',                      'Pendapatan Pajak Daerah',                                  'pajak',       NULL, 'semua',          NULL, 1, 1),
('PAD-RETRIBUSI',   'Retribusi Daerah',                   'Pendapatan Retribusi Daerah',                              'retribusi',   NULL, 'semua',          NULL, 1, 2),
('PAD-PENGELOLAAN', 'Pengelolaan Kekayaan Daerah',        'Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan',        'pengelolaan', NULL, 'semua',          NULL, 1, 3),
('PAD-LAIN',        'Lain-lain PAD yang Sah',             'Lain-lain Pendapatan Asli Daerah yang Sah',                'lain_pad',    NULL, 'semua',          NULL, 1, 4);

-- ================================================================
-- 💰 SEED DATA: PAJAK DAERAH (Level 2 & 3)
-- ================================================================

-- Sub-kategori Pajak
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, urutan) VALUES
('PAJ-PROV',  'Pajak Provinsi',         'Pajak yang dipungut oleh Pemerintah Provinsi',           'pajak', 'pajak_provinsi',       'provinsi',       'PAD-PAJAK', 2, 1),
('PAJ-KABKO', 'Pajak Kabupaten/Kota',   'Pajak yang dipungut oleh Pemerintah Kabupaten/Kota',     'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAD-PAJAK', 2, 2);

-- Pajak Provinsi (Level 3)
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, dasar_hukum, urutan) VALUES
('PAJ-PROV-PKB',        'PKB',              'Pajak Kendaraan Bermotor',                        'pajak', 'pajak_provinsi',       'provinsi', 'PAJ-PROV', 3, 'UU HKPD', 1),
('PAJ-PROV-BBNKB',      'BBNKB',            'Bea Balik Nama Kendaraan Bermotor',               'pajak', 'pajak_provinsi',       'provinsi', 'PAJ-PROV', 3, 'UU HKPD', 2),
('PAJ-PROV-PAB',        'PAB',              'Pajak Alat Berat',                                'pajak', 'pajak_provinsi',       'provinsi', 'PAJ-PROV', 3, 'UU HKPD', 3),
('PAJ-PROV-PBBKB',      'PBBKB',            'Pajak Bahan Bakar Kendaraan Bermotor',            'pajak', 'pajak_provinsi',       'provinsi', 'PAJ-PROV', 3, 'UU HKPD', 4),
('PAJ-PROV-PAP',        'PAP',              'Pajak Air Permukaan',                             'pajak', 'pajak_provinsi',       'provinsi', 'PAJ-PROV', 3, 'UU HKPD', 5),
('PAJ-PROV-ROKOK',      'Pajak Rokok',      'Pajak Rokok',                                     'pajak', 'pajak_provinsi',       'provinsi', 'PAJ-PROV', 3, 'UU HKPD', 6),
('PAJ-PROV-OPSEN-MBLB', 'Opsen Pajak MBLB', 'Opsen Pajak Mineral Bukan Logam dan Batuan',      'pajak', 'pajak_provinsi',       'provinsi', 'PAJ-PROV', 3, 'UU HKPD', 7);

-- Pajak Kabupaten/Kota (Level 3)
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, dasar_hukum, urutan) VALUES
('PAJ-KK-PBBP2',       'PBB-P2',                   'Pajak Bumi dan Bangunan Perdesaan dan Perkotaan',    'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 1),
('PAJ-KK-BPHTB',       'BPHTB',                    'Bea Perolehan Hak atas Tanah dan Bangunan',          'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 2),
('PAJ-KK-PBJT',        'PBJT',                     'Pajak Barang dan Jasa Tertentu',                     'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 3),
('PAJ-KK-REKLAME',     'Pajak Reklame',             'Pajak Reklame',                                     'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 4),
('PAJ-KK-PAT',         'PAT',                      'Pajak Air Tanah',                                   'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 5),
('PAJ-KK-MBLB',        'Pajak MBLB',               'Pajak Mineral Bukan Logam dan Batuan',               'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 6),
('PAJ-KK-WALET',       'Pajak Sarang Burung Walet', 'Pajak Sarang Burung Walet',                         'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 7),
('PAJ-KK-OPSEN-PKB',   'Opsen PKB',                'Opsen Pajak Kendaraan Bermotor',                     'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 8),
('PAJ-KK-OPSEN-BBNKB', 'Opsen BBNKB',              'Opsen Bea Balik Nama Kendaraan Bermotor',            'pajak', 'pajak_kabupaten_kota', 'kabupaten_kota', 'PAJ-KABKO', 3, 'UU HKPD', 9);

-- Sub-detail PBJT (Level 4 - objek pajak PBJT)
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, dasar_hukum, urutan) VALUES
('PBJT-MAKMIN',   'Makanan dan Minuman',       'PBJT - Makanan dan/atau Minuman',         'pajak', 'pbjt', 'kabupaten_kota', 'PAJ-KK-PBJT', 4, 'UU HKPD', 1),
('PBJT-LISTRIK',  'Tenaga Listrik',            'PBJT - Tenaga Listrik',                   'pajak', 'pbjt', 'kabupaten_kota', 'PAJ-KK-PBJT', 4, 'UU HKPD', 2),
('PBJT-HOTEL',    'Jasa Perhotelan',           'PBJT - Jasa Perhotelan',                  'pajak', 'pbjt', 'kabupaten_kota', 'PAJ-KK-PBJT', 4, 'UU HKPD', 3),
('PBJT-PARKIR',   'Jasa Parkir',               'PBJT - Jasa Parkir',                      'pajak', 'pbjt', 'kabupaten_kota', 'PAJ-KK-PBJT', 4, 'UU HKPD', 4),
('PBJT-HIBURAN',  'Jasa Kesenian dan Hiburan', 'PBJT - Jasa Kesenian dan Hiburan',        'pajak', 'pbjt', 'kabupaten_kota', 'PAJ-KK-PBJT', 4, 'UU HKPD', 5);

-- ================================================================
-- 🔥 SEED DATA: RETRIBUSI DAERAH (Level 2, 3, 4)
-- ================================================================

-- Sub-kategori Retribusi (Level 2)
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, dasar_hukum, urutan) VALUES
('RET-JU',  'Retribusi Jasa Umum',            'Retribusi Jasa Umum',                      'retribusi', 'retribusi_jasa_umum',      'semua', 'PAD-RETRIBUSI', 2, 'Pasal 87 UU HKPD', 1),
('RET-JUS', 'Retribusi Jasa Usaha',           'Retribusi Jasa Usaha',                     'retribusi', 'retribusi_jasa_usaha',     'semua', 'PAD-RETRIBUSI', 2, 'Pasal 87 UU HKPD', 2),
('RET-PT',  'Retribusi Perizinan Tertentu',   'Retribusi Perizinan Tertentu',              'retribusi', 'retribusi_perizinan',      'semua', 'PAD-RETRIBUSI', 2, 'Pasal 87 UU HKPD', 3);

-- Retribusi Jasa Umum - Objek Layanan (Level 3)
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, dasar_hukum, urutan) VALUES
('RET-JU-KESEHATAN',  'Pelayanan Kesehatan',                       'Retribusi Pelayanan Kesehatan',                          'retribusi', 'retribusi_jasa_umum', 'semua', 'RET-JU', 3, 'Pasal 87 UU HKPD', 1),
('RET-JU-KEBERSIHAN', 'Pelayanan Kebersihan',                      'Retribusi Pelayanan Kebersihan',                         'retribusi', 'retribusi_jasa_umum', 'semua', 'RET-JU', 3, 'Pasal 87 UU HKPD', 2),
('RET-JU-PARKIR',     'Pelayanan Parkir di Tepi Jalan Umum',       'Retribusi Pelayanan Parkir di Tepi Jalan Umum',          'retribusi', 'retribusi_jasa_umum', 'semua', 'RET-JU', 3, 'Pasal 87 UU HKPD', 3),
('RET-JU-PASAR',      'Pelayanan Pasar',                           'Retribusi Pelayanan Pasar',                              'retribusi', 'retribusi_jasa_umum', 'semua', 'RET-JU', 3, 'Pasal 87 UU HKPD', 4),
('RET-JU-LALIN',      'Pengendalian Lalu Lintas',                  'Retribusi Pengendalian Lalu Lintas',                     'retribusi', 'retribusi_jasa_umum', 'semua', 'RET-JU', 3, 'Pasal 87 UU HKPD', 5);

-- Retribusi Jasa Usaha - Objek Layanan (Level 3)
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, dasar_hukum, urutan) VALUES
('RET-JUS-TEMPAT-USAHA',  'Penyediaan Tempat Usaha',              'Retribusi Penyediaan Tempat Usaha (Pasar Grosir, Pertokoan, Tempat Usaha Lain)',           'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 1),
('RET-JUS-PELELANGAN',    'Penyediaan Tempat Pelelangan',         'Retribusi Penyediaan Tempat Pelelangan (Ikan, Ternak, Hasil Bumi, Hasil Hutan)',            'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 2),
('RET-JUS-PARKIR',        'Tempat Parkir Khusus',                 'Retribusi Tempat Parkir Khusus di Luar Badan Jalan',                                       'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 3),
('RET-JUS-PENGINAPAN',    'Tempat Penginapan/Vila',               'Retribusi Tempat Penginapan/Vila/Pesanggrahan',                                            'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 4),
('RET-JUS-RPH',           'Rumah Pemotongan Hewan',               'Retribusi Rumah Pemotongan Hewan',                                                        'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 5),
('RET-JUS-PELABUHAN',     'Jasa Kepelabuhanan',                   'Retribusi Jasa Kepelabuhanan',                                                            'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 6),
('RET-JUS-REKREASI',      'Tempat Rekreasi/Pariwisata/Olahraga',  'Retribusi Tempat Rekreasi, Pariwisata, dan Olahraga',                                      'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 7),
('RET-JUS-PENYEBERANGAN', 'Penyeberangan Orang/Barang di Air',    'Retribusi Penyeberangan Orang/Barang di Air',                                              'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 8),
('RET-JUS-PRODUK',        'Penjualan Produk Usaha Pemda',         'Retribusi Penjualan Produk Usaha Pemerintah Daerah',                                       'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 9),
('RET-JUS-ASET',          'Pemanfaatan Aset Daerah',              'Retribusi Pemanfaatan Aset Daerah',                                                       'retribusi', 'retribusi_jasa_usaha', 'semua', 'RET-JUS', 3, 'Pasal 87 UU HKPD', 10);

-- Retribusi Perizinan Tertentu - Objek Layanan (Level 3)
INSERT INTO ref_kategori_pad (kode, nama, nama_lengkap, kategori_utama, sub_kategori, tingkat_pemerintahan, parent_kode, level, dasar_hukum, urutan) VALUES
('RET-PT-PBG',     'Persetujuan Bangunan Gedung',       'Retribusi Persetujuan Bangunan Gedung',                'retribusi', 'retribusi_perizinan', 'semua', 'RET-PT', 3, 'Pasal 87 UU HKPD', 1),
('RET-PT-TKA',     'Penggunaan Tenaga Kerja Asing',     'Retribusi Penggunaan Tenaga Kerja Asing',              'retribusi', 'retribusi_perizinan', 'semua', 'RET-PT', 3, 'Pasal 87 UU HKPD', 2),
('RET-PT-TAMBANG', 'Pengelolaan Pertambangan Rakyat',   'Retribusi Pengelolaan Pertambangan Rakyat',            'retribusi', 'retribusi_perizinan', 'semua', 'RET-PT', 3, 'Pasal 87 UU HKPD', 3);

-- ================================================================
-- 📊 TABLE: detail_pad_data
-- Data rincian PAD per jenis per daerah per tahun
-- (untuk menyimpan breakdown detail pajak/retribusi)
-- ================================================================
CREATE TABLE IF NOT EXISTS detail_pad_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pad_data_id UUID REFERENCES pad_data(id) ON DELETE SET NULL,  -- Link ke data PAD utama
  tahun INTEGER NOT NULL,
  daerah VARCHAR(255) NOT NULL,
  kategori_kode VARCHAR(50) REFERENCES ref_kategori_pad(kode),  -- Link ke ref kategori
  anggaran DOUBLE PRECISION DEFAULT 0,
  realisasi DOUBLE PRECISION DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_detail_pad_tahun ON detail_pad_data(tahun);
CREATE INDEX IF NOT EXISTS idx_detail_pad_daerah ON detail_pad_data(daerah);
CREATE INDEX IF NOT EXISTS idx_detail_pad_kategori ON detail_pad_data(kategori_kode);
CREATE INDEX IF NOT EXISTS idx_detail_pad_data_id ON detail_pad_data(pad_data_id);

-- Trigger auto-update
-- Pastikan fungsi update_updated_at_column() sudah ada atau buat baru
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_detail_pad_updated_at
  BEFORE UPDATE ON detail_pad_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- ROW LEVEL SECURITY
-- ====================================
ALTER TABLE ref_kategori_pad ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_pad_data ENABLE ROW LEVEL SECURITY;

-- Ref kategori: everyone can read
CREATE POLICY "Anyone can read ref_kategori_pad" ON ref_kategori_pad
  FOR SELECT USING (true);

-- Detail data: same as pad_data
CREATE POLICY "Anyone can read detail_pad_data" ON detail_pad_data
  FOR SELECT USING (true);

CREATE POLICY "Auth users can insert detail_pad_data" ON detail_pad_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can update detail_pad_data" ON detail_pad_data
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete detail_pad_data" ON detail_pad_data
  FOR DELETE USING (auth.role() = 'authenticated');

-- ================================================================
-- ✅ DONE! VERIFIKASI
-- ================================================================
-- Setelah menjalankan SQL ini, cek dengan query:
-- SELECT kategori_utama, level, COUNT(*) FROM ref_kategori_pad GROUP BY kategori_utama, level ORDER BY kategori_utama, level;
