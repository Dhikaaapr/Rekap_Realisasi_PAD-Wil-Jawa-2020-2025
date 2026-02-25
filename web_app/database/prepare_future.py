
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

FUTURE_YEARS = [2026, 2027, 2028, 2029, 2030]

def prepare_future_years():
    print(f"Preparing records for future years: {FUTURE_YEARS}")
    
    # 1. Get unique list of regions from existing data
    res = supabase.table('pad_data').select('daerah').execute()
    all_regions = sorted(list(set(d['daerah'] for d in res.data)))
    print(f"Found {len(all_regions)} regions.")
    
    # Check what already exists to avoid conflict errors
    print("Checking existing records to avoid duplicates...")
    res_exist = supabase.table('pad_data').select('daerah, tahun').in_('tahun', FUTURE_YEARS).execute()
    existing = set((d['daerah'], d['tahun']) for d in res_exist.data)
    
    new_pad_records = []
    for region in all_regions:
        for year in FUTURE_YEARS:
            if (region, year) not in existing:
                new_pad_records.append({
                    'daerah': region,
                    'tahun': year,
                    'pajak_anggaran': 0,
                    'pajak_realisasi': 0,
                    'retribusi_anggaran': 0,
                    'retribusi_realisasi': 0,
                    'pengelolaan_anggaran': 0,
                    'pengelolaan_realisasi': 0,
                    'lain_pad_anggaran': 0,
                    'lain_pad_realisasi': 0
                })
            
    if new_pad_records:
        print(f"Inserting {len(new_pad_records)} new base records into pad_data...")
        for i in range(0, len(new_pad_records), 100):
            batch = new_pad_records[i:i+100]
            try:
                supabase.table('pad_data').insert(batch).execute()
            except Exception as e:
                print(f"Error inserting pad_data batch: {e}")
    else:
        print("All base records for future years already exist.")

    # 2. Propagate structure
    print("Now propagating LRA structure...")
    with open('lra_template.json', 'r') as f:
        template = json.load(f)
    
    # Get IDs for all records in future years
    res = supabase.table('pad_data').select('id, daerah, tahun').in_('tahun', FUTURE_YEARS).execute()
    all_targets = res.data
    
    print(f"Total target records to check for structure: {len(all_targets)}")
    
    for t in all_targets:
        pad_id = t['id']
        daerah = t['daerah']
        tahun = t['tahun']
        
        # Check if details already exist
        check = supabase.table('detail_pad_data').select('id').eq('pad_data_id', pad_id).limit(1).execute()
        if check.data:
            # print(f"  Skipping {daerah} {tahun}, structure exists.")
            continue
            
        print(f"  Adding structure to {daerah} {tahun}...")
        detail_rows = []
        for item in template:
            detail_rows.append({
                'pad_data_id': pad_id,
                'tahun': tahun,
                'daerah': daerah,
                'kategori_kode': item['kode'],
                'anggaran': 0,
                'realisasi': 0
            })
            
        # Batch insert details
        for i in range(0, len(detail_rows), 200):
            batch = detail_rows[i:i+200]
            try:
                supabase.table('detail_pad_data').insert(batch).execute()
            except Exception as e:
                print(f"    Detail insert error: {e}")

prepare_future_years()
