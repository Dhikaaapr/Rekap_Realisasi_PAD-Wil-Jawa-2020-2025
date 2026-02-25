
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_random_region():
    regions = ['Kota Surakarta', 'Kab. Wonogiri', 'Kota Semarang']
    for region in regions:
        print(f"\n--- Region: {region} (2025) ---")
        res = supabase.table('pad_data').select('id').eq('daerah', region).eq('tahun', 2025).execute()
        if not res.data:
            print("No data found")
            continue
            
        pad_id = res.data[0]['id']
        det = supabase.table('detail_pad_data').select('kategori_kode', count='exact').eq('pad_data_id', pad_id).execute()
        count = det.count
        print(f"Detail Row Count: {count}")
        
        if count > 0:
            # Check for a deep PBJT code
            check = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id).eq('kategori_kode', '4.1.0.1.0.19.0.1.0').execute()
            if check.data:
                print("PBJT Deep Code Found")
            else:
                print("PBJT Deep Code NOT Found")

check_random_region()
