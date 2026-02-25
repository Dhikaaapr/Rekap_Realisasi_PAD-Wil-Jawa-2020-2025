
from supabase import create_client, Client
import json
import uuid

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def migrate_structure():
    print("Loading template...")
    with open('lra_template.json', 'r') as f:
        template = json.load(f)
    
    # Remove duplicates from template
    unique_template = {}
    for item in template:
        unique_template[item['kode']] = item['nama']
    
    # 1. Update ref_kategori_pad first to ensure names exist
    print("Updates ref_kategori_pad...")
    for code, name in unique_template.items():
        if code and name:
            # We don't have kategori_utama or sub_kategori easily available, assume defaults or skip
            # The previous fix_sukoharjo populated some.
            # Let's just upsert what we have.
            try:
                # Infer categories roughly
                cat = 'PAD' if code.startswith('4.1') else 'Transfer' if code.startswith('4.2') else 'Lainnya'
                sub = None
                if code.startswith('4.1.0.1') or code.startswith('4.1.01'): sub = 'Pajak'
                if code.startswith('4.1.0.2') or code.startswith('4.1.02'): sub = 'Retribusi'
                
                payload = {
                    'kode': code, 
                    'nama': name,
                    'kategori_utama': cat,
                    'sub_kategori': sub
                }
                supabase.table('ref_kategori_pad').upsert(payload, on_conflict='kode').execute()
            except Exception as e:
                # print(f"Error upserting ref {code}: {e}")
                pass
    
    # 2. Get all regions for 2025 (or other years?)
    # User said "all regions in data". Let's master the years we have.
    print("Fetching target regions...")
    # Get distinct (daerah, tahun) pairs from pad_data
    # Supabase doesn't support distinct query easily via JS/Python client for massive datasets without iterating or RPC.
    # We'll just fetch all id, daerah, tahun, and filter locally.
    res = supabase.table('pad_data').select('id, daerah, tahun').execute()
    targets = res.data
    
    print(f"Found {len(targets)} target records.")
    
    for t in targets:
        pad_id = t['id']
        daerah = t['daerah']
        tahun = t['tahun']
        
        # Skip Sukoharjo 2024 as it is the source
        if daerah == 'Kab. Sukoharjo' and tahun == 2024: continue
        
        # Check if details exist
        det = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
        count = det.count
        
        # If very few details (e.g. only summary rows) or none, populate full structure
        # User said "buatkan seperti itu kalo belum ada isi datanya"
        # If < 50 details, likely just summary
        if count < 50:
            print(f"Populating structure for {daerah} {tahun} (current count: {count})...")
            
            # Prepare payload
            # We need to check which codes already exist to avoid duplicates
            existing_codes = set()
            if count > 0:
                det_res = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id).execute()
                for d in det_res.data: existing_codes.add(d['kategori_kode'])
            
            new_rows = []
            for code in unique_template.keys():
                if code not in existing_codes:
                    new_rows.append({
                        'pad_data_id': pad_id,
                        'tahun': tahun,
                        'daerah': daerah,
                        'kategori_kode': code,
                        'anggaran': 0,
                        'realisasi': 0
                    })
            
            # Sort by code
            new_rows.sort(key=lambda x: x['kategori_kode'])
            
            # Insert in batches
            batch_size = 100
            for i in range(0, len(new_rows), batch_size):
                batch = new_rows[i:i+batch_size]
                try:
                    supabase.table('detail_pad_data').insert(batch).execute()
                except Exception as e:
                    print(f"  Error inserting batch for {daerah}: {e}")
                    
            print(f"  Added {len(new_rows)} rows.")

    print("Migration complete.")

migrate_structure()
