-- ====================================================
-- 🏛️ NEW SCHEMA PER REGULATORY (UU HKPD)
-- ====================================================

-- 1. Tabel Pajak Provinsi
CREATE TABLE IF NOT EXISTS pajak_provinsi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    daerah VARCHAR(255) NOT NULL,
    tahun INTEGER NOT NULL,
    pkb_anggaran DOUBLE PRECISION DEFAULT 0,
    pkb_realisasi DOUBLE PRECISION DEFAULT 0,
    bbnkb_anggaran DOUBLE PRECISION DEFAULT 0,
    bbnkb_realisasi DOUBLE PRECISION DEFAULT 0,
    pab_anggaran DOUBLE PRECISION DEFAULT 0,
    pab_realisasi DOUBLE PRECISION DEFAULT 0,
    pbbkb_anggaran DOUBLE PRECISION DEFAULT 0,
    pbbkb_realisasi DOUBLE PRECISION DEFAULT 0,
    pap_anggaran DOUBLE PRECISION DEFAULT 0,
    pap_realisasi DOUBLE PRECISION DEFAULT 0,
    pajak_rokok_anggaran DOUBLE PRECISION DEFAULT 0,
    pajak_rokok_realisasi DOUBLE PRECISION DEFAULT 0,
    opsen_mblb_anggaran DOUBLE PRECISION DEFAULT 0,
    opsen_mblb_realisasi DOUBLE PRECISION DEFAULT 0,
    total_anggaran DOUBLE PRECISION DEFAULT 0,
    total_realisasi DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(daerah, tahun)
);

-- 2. Tabel Pajak Kabupaten/Kota
CREATE TABLE IF NOT EXISTS pajak_kabupaten_kota (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    daerah VARCHAR(255) NOT NULL,
    tahun INTEGER NOT NULL,
    pbb_p2_anggaran DOUBLE PRECISION DEFAULT 0,
    pbb_p2_realisasi DOUBLE PRECISION DEFAULT 0,
    bphtb_anggaran DOUBLE PRECISION DEFAULT 0,
    bphtb_realisasi DOUBLE PRECISION DEFAULT 0,
    pbjt_total_anggaran DOUBLE PRECISION DEFAULT 0,
    pbjt_total_realisasi DOUBLE PRECISION DEFAULT 0,
    reklame_anggaran DOUBLE PRECISION DEFAULT 0,
    reklame_realisasi DOUBLE PRECISION DEFAULT 0,
    pat_anggaran DOUBLE PRECISION DEFAULT 0,
    pat_realisasi DOUBLE PRECISION DEFAULT 0,
    mblb_anggaran DOUBLE PRECISION DEFAULT 0,
    mblb_realisasi DOUBLE PRECISION DEFAULT 0,
    walet_anggaran DOUBLE PRECISION DEFAULT 0,
    walet_realisasi DOUBLE PRECISION DEFAULT 0,
    opsen_pkb_anggaran DOUBLE PRECISION DEFAULT 0,
    opsen_pkb_realisasi DOUBLE PRECISION DEFAULT 0,
    opsen_bbnkb_anggaran DOUBLE PRECISION DEFAULT 0,
    opsen_bbnkb_realisasi DOUBLE PRECISION DEFAULT 0,
    total_anggaran DOUBLE PRECISION DEFAULT 0,
    total_realisasi DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(daerah, tahun)
);

-- 3. Tabel SBJT Objek (Sub-tabel Pajak Kabupaten)
CREATE TABLE IF NOT EXISTS pbjt_objek (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pajak_kabkota_id UUID REFERENCES pajak_kabupaten_kota(id) ON DELETE CASCADE,
    jenis VARCHAR(100) NOT NULL, -- Makanan/Minuman, Tenaga Listrik, Hotel, Parkir, Hiburan
    anggaran DOUBLE PRECISION DEFAULT 0,
    realisasi DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Retribusi
CREATE TABLE IF NOT EXISTS retribusi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    daerah VARCHAR(255) NOT NULL,
    tahun INTEGER NOT NULL,
    kategori VARCHAR(50) NOT NULL, -- jasa_umum, jasa_usaha, perizinan_tertentu
    total_anggaran DOUBLE PRECISION DEFAULT 0,
    total_realisasi DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(daerah, tahun, kategori)
);

-- 5. Tabel Retribusi Detail
CREATE TABLE IF NOT EXISTS retribusi_detail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retribusi_id UUID REFERENCES retribusi(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    anggaran DOUBLE PRECISION DEFAULT 0,
    realisasi DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_provinsi BEFORE UPDATE ON pajak_provinsi FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_kabkota BEFORE UPDATE ON pajak_kabupaten_kota FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_retribusi BEFORE UPDATE ON retribusi FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
