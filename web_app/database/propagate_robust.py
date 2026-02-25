
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def migrate_structure_robust():
    print("Loading template...")
    with open('lra_template.json', 'r') as f:
        template_raw = json.load(f)
    
    unique_template = {}
    for item in template_raw:
        if item['kode']:
            unique_template[item['kode']] = item['nama']
    
    # 1. Update ref_kategori_pad
    print("Updates ref_kategori_pad labels...")
    all_codes = sorted(unique_template.keys())
    for code in all_codes:
        name = unique_template[code]
        try:
            cat = 'PAD' if code.startswith('4.1') else 'Transfer' if code.startswith('4.2') else 'Lainnya'
            sub = 'Pajak' if (code.startswith('4.1.01') or code.startswith('4.1.0.1')) else \
                  'Retribusi' if (code.startswith('4.1.02') or code.startswith('4.1.0.2')) else \
                  'Hasil Pengelolaan' if (code.startswith('4.1.03') or code.startswith('4.1.0.3')) else \
                  'Lain-lain PAD' if (code.startswith('4.1.04') or code.startswith('4.1.0.4')) else None
            
            supabase.table('ref_kategori_pad').upsert({
                'kode': code,
                'nama': name,
                'kategori_utama': cat,
                'sub_kategori': sub
            }, on_conflict='kode').execute()
        except: pass

    # 2. Get target regions
    print("Fetching target records...")
    res = supabase.table('pad_data').select('id, daerah, tahun').execute()
    targets = res.data
    
    for t in targets:
        pad_id = t['id']
        daerah = t['daerah']
        tahun = t['tahun']
        
        # Skip source
        if daerah == 'Kab. Sukoharjo' and tahun == 2024: continue
        
        print(f"Processing {daerah} {tahun}...")
        
        # Get existing codes for this record
        det_res = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id).execute()
        existing_codes = set(d['kategori_kode'] for d in det_res.data)
        
        missing_codes = []
        for code in all_codes:
            if code not in existing_codes:
                missing_codes.append(code)
        
        if missing_codes:
            print(f"  Adding {len(missing_codes)} missing codes...")
            new_rows = []
            for code in missing_codes:
                new_rows.append({
                    'pad_data_id': pad_id,
                    'tahun': tahun,
                    'daerah': daerah,
                    'kategori_kode': code,
                    'anggaran': 0,
                    'realisasi': 0
                })
            
            # Batch insert
            for i in range(0, len(new_rows), 200):
                batch = new_rows[i:i+200]
                try:
                    supabase.table('detail_pad_data').insert(batch).execute()
                except Exception as e:
                    print(f"  Batch error: {e}")
        else:
            print("  Structure already complete.")

migrate_structure_robust()
