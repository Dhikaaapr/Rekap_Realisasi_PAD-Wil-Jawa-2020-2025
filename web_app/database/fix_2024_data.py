from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

TAHUN = 2024

# =============================================
# STEP 1: Hapus duplikat "Provinsi ..." yang nilainya kosong/duplikat
# Nama baku pakai prefix "Prov. " (bukan "Provinsi ")
# =============================================
print("=== STEP 1: Hapus duplikat Provinsi dengan nama 'Provinsi ...' ===")
bad_prov_names = ['Provinsi Banten', 'Provinsi DI Yogyakarta', 'Provinsi DKI Jakarta',
                  'Provinsi Jawa Barat', 'Provinsi Jawa Tengah', 'Provinsi Jawa Timur']

for name in bad_prov_names:
    # Cek apakah ada
    res = supabase.table('pad_data').select('id, pajak_realisasi').eq('tahun', TAHUN).eq('daerah', name).execute()
    if res.data:
        pad_id = res.data[0]['id']
        # Hapus detail-nya dulu
        supabase.table('detail_pad_data').delete().eq('pad_data_id', pad_id).execute()
        # Hapus pad_data-nya
        supabase.table('pad_data').delete().eq('id', pad_id).execute()
        print(f"  Deleted duplicate: {name}")
    else:
        print(f"  Not found (skip): {name}")

# =============================================
# STEP 2: Hapus wilayah non-Jawa yang masuk
# =============================================
print("\n=== STEP 2: Hapus wilayah NON-JAWA yang masuk ===")
JAWA_PROV = ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten']
JAWA_KEYWORDS = [
    'JAKARTA', 'SERIBU', 'BANDUNG', 'BOGOR', 'BEKASI', 'DEPOK', 'CIMAHI', 'TASIKMALAYA', 'CIREBON',
    'SUKABUMI', 'BANJAR', 'CIANJUR', 'GARUT', 'INDRAMAYU', 'KARAWANG', 'KUNINGAN', 'MAJALENGKA',
    'PANGANDARAN', 'PURWAKARTA', 'SUBANG', 'SUMEDANG', 'CIAMIS', 'TANGERANG', 'SERANG', 'CILEGON',
    'LEBAK', 'PANDEGLANG', 'SEMARANG', 'SURAKARTA', 'SOLO', 'MAGELANG', 'PEKALONGAN', 'SALATIGA',
    'TEGAL', 'BANYUMAS', 'BATANG', 'BLORA', 'BOYOLALI', 'BREBES', 'CILACAP', 'DEMAK', 'GROBOGAN',
    'JEPARA', 'KEBUMEN', 'KENDAL', 'KLATEN', 'KUDUS', 'PATI', 'PEMALANG', 'PURBALINGGA', 'PURWOREJO',
    'REMBANG', 'SRAGEN', 'SUKOHARJO', 'TEMANGGUNG', 'WONOGIRI', 'WONOSOBO', 'YOGYAKARTA', 'SLEMAN',
    'BANTUL', 'KULON PROGO', 'GUNUNG KIDUL', 'SURABAYA', 'MALANG', 'BATU', 'BLITAR', 'KEDIRI',
    'MADIUN', 'MOJOKERTO', 'PASURUAN', 'PROBOLINGGO', 'BANGKALAN', 'BANYUWANGI', 'BOJONEGORO',
    'BONDOWOSO', 'GRESIK', 'JEMBER', 'JOMBANG', 'LAMONGAN', 'LUMAJANG', 'MAGETAN', 'NGANJUK',
    'NGAWI', 'PACITAN', 'PAMEKASAN', 'PONOROGO', 'SAMPANG', 'SIDOARJO', 'SITUBONDO', 'SUMENEP',
    'TRENGGALEK', 'TUBAN', 'TULUNGAGUNG', 'JAWA', 'BANTEN', 'DI YOGYAKARTA',
]

def is_jawa(name):
    name_up = name.upper()
    if any(p.upper() in name_up for p in JAWA_PROV): return True
    return any(f' {k}' in f' {name_up}' or name_up.startswith(k) for k in JAWA_KEYWORDS)

all_2024 = supabase.table('pad_data').select('id, daerah').eq('tahun', TAHUN).execute()
deleted_nonjawa = 0
for row in all_2024.data:
    if not is_jawa(row['daerah']):
        pad_id = row['id']
        supabase.table('detail_pad_data').delete().eq('pad_data_id', pad_id).execute()
        supabase.table('pad_data').delete().eq('id', pad_id).execute()
        print(f"  Deleted non-Jawa: {row['daerah']}")
        deleted_nonjawa += 1
print(f"  Total deleted: {deleted_nonjawa}")

# =============================================
# STEP 3: Recalculate pad_data ringkasan dari detail_pad_data untuk semua 2024
# =============================================
print("\n=== STEP 3: Sync kolom ringkasan pad_data dari detail_pad_data ===")
all_2024_fresh = supabase.table('pad_data').select('id, daerah').eq('tahun', TAHUN).execute()
synced = 0
for row in all_2024_fresh.data:
    pad_id = row['id']
    daerah = row['daerah']
    
    # Fetch semua detail untuk wilayah ini
    details = supabase.table('detail_pad_data').select('kategori_kode, anggaran, realisasi').eq('pad_data_id', pad_id).execute()
    
    if not details.data:
        continue
    
    pajak_ang = pajak_rel = ret_ang = ret_rel = peng_ang = peng_rel = lain_ang = lain_rel = 0.0
    
    for det in details.data:
        kode = (det.get('kategori_kode') or '').upper()
        ang = det.get('anggaran') or 0
        rel = det.get('realisasi') or 0
        
        # Map kategori kode ke komponen PAD
        if 'PAD-PAJAK' in kode or kode.startswith('4.1.01') or kode.startswith('PAJ'):
            pajak_ang += ang
            pajak_rel += rel
        elif 'PAD-RETRIBUSI' in kode or kode.startswith('4.1.02') or kode.startswith('RET'):
            ret_ang += ang
            ret_rel += rel
        elif 'PAD-PENGELOLAAN' in kode or kode.startswith('4.1.03'):
            peng_ang += ang
            peng_rel += rel
        elif 'PAD-LAIN' in kode or kode.startswith('4.1.04'):
            lain_ang += ang
            lain_rel += rel
    
    total_rel = pajak_rel + ret_rel + peng_rel + lain_rel
    
    if total_rel > 0:
        supabase.table('pad_data').update({
            'pajak_anggaran': pajak_ang,
            'pajak_realisasi': pajak_rel,
            'retribusi_anggaran': ret_ang,
            'retribusi_realisasi': ret_rel,
            'pengelolaan_anggaran': peng_ang,
            'pengelolaan_realisasi': peng_rel,
            'lain_pad_anggaran': lain_ang,
            'lain_pad_realisasi': lain_rel,
        }).eq('id', pad_id).execute()
        synced += 1
        print(f"  Synced: {daerah} > Rp {total_rel/1e9:.1f}M")

print(f"\n  Total synced: {synced} wilayah")

# =============================================
# STEP 4: Cek hasil akhir
# =============================================
print("\n=== HASIL AKHIR DATA 2024 ===")
final = supabase.table('pad_data').select('daerah, pajak_realisasi, retribusi_realisasi').eq('tahun', TAHUN).order('daerah').execute()
nonzero = [d for d in final.data if (d.get('pajak_realisasi') or 0) + (d.get('retribusi_realisasi') or 0) > 0]
print(f"Total wilayah 2024: {len(final.data)}")
print(f"Wilayah dengan data non-zero: {len(nonzero)}")
