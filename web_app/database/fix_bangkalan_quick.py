
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def fix_bangkalan_quick():
    with open('lra_template.json', 'r') as f:
        template = json.load(f)
    
    # Target specific record from screenshot
    res = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Bangkalan').eq('tahun', 2029).execute()
    if res.data:
        pad_id = res.data[0]['id']
        print(f"Fixing Bangkalan 2029 (ID: {pad_id})...")
        
        new_rows = []
        for item in template:
            new_rows.append({
                'pad_data_id': pad_id,
                'tahun': 2029,
                'daerah': 'Kab. Bangkalan',
                'kategori_kode': item['kode'],
                'anggaran': 0,
                'realisasi': 0
            })
        
        for i in range(0, len(new_rows), 200):
            batch = new_rows[i:i+200]
            supabase.table('detail_pad_data').insert(batch).execute()
        print("Done!")

fix_bangkalan_quick()
