
from supabase import create_client, Client
import json
import time
import sys

# Increase recursion depth just in case, though not needed here usually
sys.setrecursionlimit(2000)

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

JAWA_KABKOTA = [
  'Kab. Bandung', 'Kab. Bandung Barat', 'Kab. Bogor', 'Kab. Bekasi', 'Kota Depok', 'Kota Cimahi', 'Kota Tasikmalaya',
  'Kota Cirebon', 'Kota Bekasi', 'Kota Bogor', 'Kota Bandung', 'Kota Sukabumi', 'Kota Banjar', 'Kab. Cianjur', 'Kab. Garut', 'Kab. Indramayu', 'Kab. Karawang',
  'Kab. Kuningan', 'Kab. Majalengka', 'Kab. Pangandaran', 'Kab. Purwakarta', 'Kab. Subang', 'Kab. Sumedang', 'Kab. Ciamis', 'Kab. Tasikmalaya', 'Kab. Cirebon', 'Kab. Sukabumi',
  'Kab. Tangerang', 'Kab. Serang', 'Kota Cilegon', 'Kota Serang', 'Kota Tangerang', 'Kota Tangerang Selatan', 'Kab. Lebak', 'Kab. Pandeglang',
  'Prov. DKI Jakarta', 'Kota Adm. Jakarta Pusat', 'Kota Adm. Jakarta Utara', 'Kota Adm. Jakarta Barat', 'Kota Adm. Jakarta Selatan', 'Kota Adm. Jakarta Timur', 'Kab. Adm. Kepulauan Seribu', 'DKI Jakarta',
  'Kota Semarang', 'Kota Surakarta', 'Kota Magelang', 'Kota Pekalongan', 'Kota Salatiga', 'Kota Tegal',
  'Kab. Banyumas', 'Kab. Batang', 'Kab. Blora', 'Kab. Boyolali', 'Kab. Brebes', 'Kab. Cilacap', 'Kab. Demak', 'Kab. Grobogan',
  'Kab. Jepara', 'Kab. Kebumen', 'Kab. Kendal', 'Kab. Klaten', 'Kab. Kudus', 'Kab. Pati', 'Kab. Pemalang', 'Kab. Purbalingga',
  'Kab. Purworejo', 'Kab. Rembang', 'Kab. Sragen', 'Kab. Sukoharjo', 'Kab. Temanggung', 'Kab. Wonogiri', 'Kab. Wonosobo',
  'Kab. Banjarnegara', 'Kab. Karanganyar', 'Kab. Magelang', 'Kab. Pekalongan', 'Kab. Semarang', 'Kab. Tegal',
  'Kota Yogyakarta', 'Kab. Sleman', 'Kab. Bantul', 'Kab. Kulon Progo', 'Kab. Gunung Kidul', 'DI Yogyakarta',
  'Kota Surabaya', 'Kota Malang', 'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Mojokerto',
  'Kota Pasuruan', 'Kota Probolinggo', 'Kab. Bangkalan', 'Kab. Banyuwangi', 'Kab. Bojonegoro', 'Kab. Bondowoso',
  'Kab. Gresik', 'Kab. Jember', 'Kab. Jombang', 'Kab. Lamongan', 'Kab. Lumajang', 'Kab. Magetan', 'Kab. Nganjuk',
  'Kab. Ngawi', 'Kab. Pacitan', 'Kab. Pamekasan', 'Kab. Ponorogo', 'Kab. Sampang', 'Kab. Sidoarjo', 'Kab. Situbondo',
  'Kab. Sumenep', 'Kab. Trenggalek', 'Kab. Tuban', 'Kab. Tulungagung', 'Kab. Blitar', 'Kab. Kediri', 'Kab. Madiun', 'Kab. Malang', 'Kab. Mojokerto', 'Kab. Pasuruan', 'Kab. Probolinggo',
  'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. Jawa Timur', 'Prov. Banten'
]

YEARS = [2021, 2022, 2023, 2024, 2025]

def get_existing_map():
    print("Fetching existing map...")
    existing_map = {}
    try:
        # Fetch in chunks if needed or just fetch all logic
        # Assuming < 5000 rows
        res = supabase.table('pad_data').select('id, daerah, tahun').execute()
        for row in res.data:
            key = f"{row['daerah']}|{row['tahun']}"
            existing_map[key] = row['id']
            # Also add lower case version
            existing_map[f"{row['daerah'].lower()}|{row['tahun']}"] = row['id']
    except Exception as e:
        print(f"Error fetching pad_data: {e}")
    return existing_map

def seed_pad_data(existing_map):
    print("Seeding pad_data...")
    for r in JAWA_KABKOTA:
        for y in YEARS:
            key_lower = f"{r.lower()}|{y}"
            if key_lower in existing_map:
                continue
            
            print(f"Creating missing pad_data: {r} - {y}")
            try:
                data = {
                    'daerah': r,
                    'tahun': y,
                    'pajak_anggaran': 0, 'pajak_realisasi': 0,
                    'retribusi_anggaran': 0, 'retribusi_realisasi': 0,
                    'pengelolaan_anggaran': 0, 'pengelolaan_realisasi': 0,
                    'lain_pad_anggaran': 0, 'lain_pad_realisasi': 0
                }
                res = supabase.table('pad_data').insert(data).execute()
                if res.data:
                    existing_map[key_lower] = res.data[0]['id']
            except Exception as e:
                print(f"Failed to create {r} {y}: {e}")
                # Provide more details if possible
                if hasattr(e, 'message'): print(e.message)
                if hasattr(e, 'details'): print(e.details)
                if hasattr(e, 'code'): print(e.code)

def populate_details(existing_map):
    print("Populating details...")
    
    with open('lra_template.json', 'r') as f:
        template = json.load(f)
    print(f"Template size: {len(template)} items")
    
    # Pre-process template into a list of dicts for faster access
    template_codes = [t['kode'] for t in template]
    
    count_processed = 0
    total_tasks = len(JAWA_KABKOTA) * len(YEARS)
    
    for r in JAWA_KABKOTA:
        for y in YEARS:
            key_lower = f"{r.lower()}|{y}"
            if key_lower not in existing_map:
                print(f"Skipping {r} {y} (no pad_data ID found)")
                continue
                
            pad_id = existing_map[key_lower]
            
            # Check existing count
            try:
                count_res = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
                current_count = count_res.count
                
                if current_count < (len(template) * 0.9):
                    print(f"Filling details for {r} {y} (Current: {current_count})...")
                    
                    # Get existing codes
                    exist_res = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id).execute()
                    existing_codes = set(row['kategori_kode'] for row in exist_res.data)
                    
                    rows_to_insert = []
                    for t in template:
                        if t['kode'] not in existing_codes:
                            rows_to_insert.append({
                                'pad_data_id': pad_id,
                                'tahun': y,
                                'daerah': r,
                                'kategori_kode': t['kode'],
                                'anggaran': 0,
                                'realisasi': 0
                            })
                    
                    # Batch insert
                    if rows_to_insert:
                        print(f"  -> Inserting {len(rows_to_insert)} rows...")
                        batch_size = 100
                        for i in range(0, len(rows_to_insert), batch_size):
                            batch = rows_to_insert[i:i+batch_size]
                            try:
                                supabase.table('detail_pad_data').insert(batch).execute()
                            except Exception as insert_err:
                                print(f"  -> Insert Error batch {i}: {insert_err}")
                
            except Exception as e:
                print(f"Error checking details for {r} {y}: {e}")
            
            count_processed += 1
            if count_processed % 20 == 0:
                print(f"Progress: {count_processed}/{total_tasks}")

if __name__ == "__main__":
    existing_map = get_existing_map()
    seed_pad_data(existing_map)
    # Refresh map just in case (though we updated it locally)
    # existing_map = get_existing_map() 
    populate_details(existing_map)
