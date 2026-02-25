
from supabase import create_client, Client
import json
import time

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

FUTURE_YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]

def fix_all_records():
    print("🚀 Starting Global Structure Fix (2021-2030)")
    
    # 1. Load Template
    with open('lra_template.json', 'r') as f:
        template = json.load(f)
    print(f"Template loaded with {len(template)} components.")

    # 2. Get all regions from pad_data
    res = supabase.table('pad_data').select('id, daerah, tahun').execute()
    all_records = res.data
    print(f"Found {len(all_records)} total records in pad_data.")

    for record in all_records:
        pad_id = record['id']
        daerah = record['daerah']
        tahun = record['tahun']

        # Check if structure already exists (count rows)
        check = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
        current_count = check.count
        
        # If count is significantly lower than template, fill it in
        if current_count < (len(template) * 0.8):
            print(f"📦 Populating {daerah} ({tahun}) - Current: {current_count}")
            
            # Get existing codes to avoid duplicate key errors
            exist_res = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id).execute()
            existing_codes = set(d['kategori_kode'] for d in exist_res.data)
            
            new_rows = []
            for item in template:
                if item['kode'] not in existing_codes:
                    new_rows.append({
                        'pad_data_id': pad_id,
                        'tahun': tahun,
                        'daerah': daerah,
                        'kategori_kode': item['kode'],
                        'anggaran': 0,
                        'realisasi': 0
                    })
            
            if new_rows:
                # Batch insert
                for i in range(0, len(new_rows), 200):
                    batch = new_rows[i:i+200]
                    try:
                        supabase.table('detail_pad_data').insert(batch).execute()
                    except: pass
        # else:
        #     print(f"✅ {daerah} ({tahun}) already has {current_count} rows.")

fix_all_records()
