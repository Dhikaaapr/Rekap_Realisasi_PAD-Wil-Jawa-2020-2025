
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def verify_final():
    print("Verifying Sukoharjo 2025 details...")
    res = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2025).execute()
    if not res.data:
        print("Sukoharjo 2025 not found")
        return
        
    pad_id = res.data[0]['id']
    det = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
    count = det.count
    print(f"Total details for Sukoharjo 2025: {count}")
    
    # Check for a specific rare code from 2024 template
    # e.g. 4.1.0.1.0.19.0.5.0 (PBJT Hiburan)
    rare_code = '4.1.0.1.0.19.0.5.0'
    check = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id).eq('kategori_kode', rare_code).execute()
    if check.data:
        print(f"Sub-category {rare_code} successfully propagated to 2025!")
    else:
        print(f"Sub-category {rare_code} NOT FOUND in 2025.")

verify_final()
