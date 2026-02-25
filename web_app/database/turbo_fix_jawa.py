
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def turbo_fix_jawa():
    with open('lra_template.json', 'r') as f:
        template = json.load(f)
    
    # Target common Jawa regions that user might check first
    priority_regions = [
        'Kab. Sukoharjo', 'Kota Bandung', 'Kota Surabaya', 'Kota Semarang', 
        'Kab. Bangkalan', 'Kota Surakarta', 'Kota Malang', 'Kab. Sleman',
        'Kota Yogyakarta', 'Prov. Jawa Tengah', 'Prov. Jawa Timur', 'Prov. Jawa Barat'
    ]
    
    years = [2021, 2022, 2023, 2024, 2025]
    
    for r in priority_regions:
        for y in years:
            res = supabase.table('pad_data').select('id').eq('daerah', r).eq('tahun', y).execute()
            if res.data:
                pad_id = res.data[0]['id']
                # Check if empty
                check = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
                if check.count == 0:
                    print(f"Turbo-filling {r} {y}...")
                    rows = [{
                        'pad_data_id': pad_id, 'tahun': y, 'daerah': r,
                        'kategori_kode': item['kode'], 'anggaran': 0, 'realisasi': 0
                    } for item in template]
                    for i in range(0, len(rows), 200):
                        supabase.table('detail_pad_data').insert(rows[i:i+200]).execute()

turbo_fix_jawa()
