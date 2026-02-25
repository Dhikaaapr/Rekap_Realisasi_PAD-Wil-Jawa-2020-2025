
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_data_availability():
    years = [2021, 2022, 2023, 2024, 2025]
    print("Checking Data counts for various regions across years:")
    regions = ['Kab. Sukoharjo', 'Kota Bandung', 'Kab. Bangkalan']
    
    results = []
    for r in regions:
        for y in years:
            # Check pad_data
            pd_res = supabase.table('pad_data').select('id').eq('daerah', r).eq('tahun', y).execute()
            if pd_res.data:
                pad_id = pd_res.data[0]['id']
                # Check rincian count
                det_res = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
                results.append({'daerah': r, 'tahun': y, 'pad_id': 'Exists', 'rincian_count': det_res.count})
            else:
                results.append({'daerah': r, 'tahun': y, 'pad_id': 'MISSING', 'rincian_count': 0})
                
    df = pd.DataFrame(results)
    print(df.to_string())

check_data_availability()
