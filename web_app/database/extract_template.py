
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def extract_template():
    print("Extracting template from Sukoharjo 2024...")
    
    # Get Sukoharjo 2024 pad_id
    res = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2024).execute()
    if not res.data:
        print("No source data found!")
        return

    pad_id = res.data[0]['id']
    
    # Get all details
    det = supabase.table('detail_pad_data').select('kategori_kode, ref_kategori_pad(nama)').eq('pad_data_id', pad_id).execute()
    details = det.data
    
    # Build unique list of code -> name
    # We prefer the name from ref_kategori_pad if available, otherwise we might need to check if we can get it from somewhere else
    # But wait, my previous analysis showed names. Where did they come from?
    # Ah, the analysis script fetched `ref_kategori_pad(nama)`.
    # Let's hope all Sukoharjo codes have names in ref_kategori_pad by now (fix_sukoharjo.py added some, but maybe not all detail ones).
    # Wait, fix_sukoharjo.py only added 'Pajak Daerah', 'Retribusi Daerah' etc. not the deep ones.
    # Where did the names in `analyze_sukoharjo_2024.py` come from then?
    # Ah, I see `d.get('ref_kategori_pad')`.
    # Let's check if they are actually populated.
    
    template = []
    missing_names = []
    
    for d in details:
        code = d['kategori_kode']
        name = d.get('ref_kategori_pad', {}).get('nama')
        
        if not name:
            missing_names.append(code)
            # Temporary fallback name if manageable
            name = f"Komponen {code}" 
        
        template.append({'kode': code, 'nama': name})

    print(f"Template extracted: {len(template)} items")
    if missing_names:
        print(f"Warning: {len(missing_names)} items have no name in ref_kategori_pad. Examples: {missing_names[:5]}")
        # If names are missing in DB, we can't propagate "empty" names to other regions effectively as they won't know what it is.
        # We need to get the names from the Excel file if they are missing in DB.
    
    # Save to file
    with open('lra_template.json', 'w') as f:
        json.dump(template, f, indent=2)

extract_template()
