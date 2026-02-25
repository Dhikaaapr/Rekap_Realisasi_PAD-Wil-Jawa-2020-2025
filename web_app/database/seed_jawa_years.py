
from supabase import create_client, Client
import json
import time

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

JAWA_KABKOTA = [
  # West Java
  'Kab. Bandung', 'Kab. Bandung Barat', 'Kab. Bogor', 'Kab. Bekasi', 'Kota Depok', 'Kota Cimahi', 'Kota Tasikmalaya',
  'Kota Cirebon', 'Kota Bekasi', 'Kota Bogor', 'Kota Bandung', 'Kota Sukabumi', 'Kota Banjar', 'Kab. Cianjur', 'Kab. Garut', 'Kab. Indramayu', 'Kab. Karawang',
  'Kab. Kuningan', 'Kab. Majalengka', 'Kab. Pangandaran', 'Kab. Purwakarta', 'Kab. Subang', 'Kab. Sumedang', 'Kab. Ciamis', 'Kab. Tasikmalaya', 'Kab. Cirebon', 'Kab. Sukabumi',
  # Banten
  'Kab. Tangerang', 'Kab. Serang', 'Kota Cilegon', 'Kota Serang', 'Kota Tangerang', 'Kota Tangerang Selatan', 'Kab. Lebak', 'Kab. Pandeglang',
  # DKI Jakarta
  'Prov. DKI Jakarta', 'Kota Adm. Jakarta Pusat', 'Kota Adm. Jakarta Utara', 'Kota Adm. Jakarta Barat', 'Kota Adm. Jakarta Selatan', 'Kota Adm. Jakarta Timur', 'Kab. Adm. Kepulauan Seribu', 'DKI Jakarta',
  # Central Java
  'Kota Semarang', 'Kota Surakarta', 'Kota Magelang', 'Kota Pekalongan', 'Kota Salatiga', 'Kota Tegal',
  'Kab. Banyumas', 'Kab. Batang', 'Kab. Blora', 'Kab. Boyolali', 'Kab. Brebes', 'Kab. Cilacap', 'Kab. Demak', 'Kab. Grobogan',
  'Kab. Jepara', 'Kab. Kebumen', 'Kab. Kendal', 'Kab. Klaten', 'Kab. Kudus', 'Kab. Pati', 'Kab. Pemalang', 'Kab. Purbalingga',
  'Kab. Purworejo', 'Kab. Rembang', 'Kab. Sragen', 'Kab. Sukoharjo', 'Kab. Temanggung', 'Kab. Wonogiri', 'Kab. Wonosobo',
  'Kab. Banjarnegara', 'Kab. Karanganyar', 'Kab. Magelang', 'Kab. Pekalongan', 'Kab. Semarang', 'Kab. Tegal',
  # DIY Yogyakarta
  'Kota Yogyakarta', 'Kab. Sleman', 'Kab. Bantul', 'Kab. Kulon Progo', 'Kab. Gunung Kidul', 'DI Yogyakarta',
  # East Java
  'Kota Surabaya', 'Kota Malang', 'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Mojokerto',
  'Kota Pasuruan', 'Kota Probolinggo', 'Kab. Bangkalan', 'Kab. Banyuwangi', 'Kab. Bojonegoro', 'Kab. Bondowoso',
  'Kab. Gresik', 'Kab. Jember', 'Kab. Jombang', 'Kab. Lamongan', 'Kab. Lumajang', 'Kab. Magetan', 'Kab. Nganjuk',
  'Kab. Ngawi', 'Kab. Pacitan', 'Kab. Pamekasan', 'Kab. Ponorogo', 'Kab. Sampang', 'Kab. Sidoarjo', 'Kab. Situbondo',
  'Kab. Sumenep', 'Kab. Trenggalek', 'Kab. Tuban', 'Kab. Tulungagung', 'Kab. Blitar', 'Kab. Kediri', 'Kab. Madiun', 'Kab. Malang', 'Kab. Mojokerto', 'Kab. Pasuruan', 'Kab. Probolinggo',
  # Provinces
  'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. Jawa Timur', 'Prov. Banten'
]

# Normalize casing for comparison/insertion
NORMALIZED_REGIONS = []
for r in JAWA_KABKOTA:
    # Use Title Case for consistency in DB if preferred, but existing DB implies mix.
    # We will stick to the casing in the list above as the canonical source.
    NORMALIZED_REGIONS.append(r)

YEARS = [2021, 2022, 2023, 2024, 2025]

def seed_regions_years():
    print(f"🌱 Seeding Pad Data for {len(NORMALIZED_REGIONS)} regions x {len(YEARS)} years...")
    
    # Cache existing pad_data (id, daerah, tahun) to minimize queries
    # Fetch all could be large, but for 500 regions x 5 years = 2500 rows, it's fine.
    res = supabase.table('pad_data').select('id, daerah, tahun, status').execute()
    existing_map = {} # Key: "daerah|tahun" -> ID
    
    for row in res.data:
        key = f"{row['daerah']}|{row['tahun']}"
        existing_map[key] = row['id']
        
    print(f"Found {len(existing_map)} existing region-year combinations.")

    created_count = 0
    
    for r in NORMALIZED_REGIONS:
        for y in YEARS:
            key = f"{r}|{y}"
            
            # Case insensitive check might be safer?
            # Creating a case-insensitive map would be better but for now let's trust the list.
            
            # Try to find case-insensitive match in existing map
            found = False
            for exist_key in existing_map:
                exist_r, exist_y = exist_key.split('|')
                if exist_r.lower() == r.lower() and int(exist_y) == y:
                    found = True
                    break
            
            if not found:
                print(f"Creating missing record: {r} - {y}")
                try:
                    data = {
                        'daerah': r,
                        'tahun': y,
                        'pajak_anggaran': 0, 'pajak_realisasi': 0,
                        'retribusi_anggaran': 0, 'retribusi_realisasi': 0,
                        'pengelolaan_anggaran': 0, 'pengelolaan_realisasi': 0,
                        'lain_pad_anggaran': 0, 'lain_pad_realisasi': 0,
                        'total_pad_anggaran': 0, 'total_pad_realisasi': 0,
                        'status': 'Draft'
                    }
                    insert_res = supabase.table('pad_data').insert(data).execute()
                    if insert_res.data:
                         new_id = insert_res.data[0]['id']
                         # Update local map
                         existing_map[f"{r}|{y}"] = new_id
                         created_count += 1
                except Exception as e:
                    print(f"Error creating {r} {y}: {e}")

    print(f"✅ Seeding complete. Created {created_count} new pad_data records.")
    
    # NOW call the structure fixer logic for these IDs
    # We can reuse the logic from fix_all_structures.py or just inline it here for the newly created ones + existing ones
    
    # Load template
    with open('lra_template.json', 'r') as f:
        template = json.load(f)
    print("Template loaded.")
    
    # We should iterate ALL relevant regions to ensure structure is there
    # Filtering by our target regions only to save time if DB has other junk
    
    total_processed = 0
    
    for r in NORMALIZED_REGIONS:
        for y in YEARS:
            # Find ID
            target_id = None
            for exist_key, pid in existing_map.items():
                exist_r, exist_y = exist_key.split('|')
                if exist_r.lower() == r.lower() and int(exist_y) == y:
                    target_id = pid
                    break
            
            if not target_id: continue

            # Check detail count
            # We assume if we just created it, it's empty. If it existed, we check.
            # To be safe and efficient: query count.
            
            count_res = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', target_id).execute()
            count = count_res.count
            
            if count < (len(template) * 0.9): 
                print(f"Populating details for {r} {y} (Current: {count})...")
                
                # Fetch existing codes to avoid dupes
                exist_codes_res = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', target_id).execute()
                existing_codes = set(d['kategori_kode'] for d in exist_codes_res.data)
                
                rows_to_insert = []
                for item in template:
                    if item['kode'] not in existing_codes:
                        rows_to_insert.append({
                            'pad_data_id': target_id,
                            'tahun': y,
                            'daerah': r,
                            'kategori_kode': item['kode'],
                            'anggaran': 0,
                            'realisasi': 0
                        })
                
                if rows_to_insert:
                    # Batch insert
                    batch_size = 100
                    for i in range(0, len(rows_to_insert), batch_size):
                        batch = rows_to_insert[i:i+batch_size]
                        try:
                            supabase.table('detail_pad_data').insert(batch).execute()
                        except Exception as e:
                            print(f"Error inserting batch for {r} {y}: {e}")
                    print(f"Inserted {len(rows_to_insert)} rows.")
            
            total_processed += 1
            if total_processed % 10 == 0:
                print(f"Progress: {total_processed} region-years checked.")

seed_regions_years()
