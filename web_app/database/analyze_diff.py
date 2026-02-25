
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def analyze_diff():
    # Source: Sukoharjo 2024
    res1 = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2024).execute()
    pad_id1 = res1.data[0]['id']
    det1 = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id1).execute()
    codes1 = set(d['kategori_kode'] for d in det1.data)
    
    # Target: Kota Surakarta 2025
    res2 = supabase.table('pad_data').select('id').eq('daerah', 'Kota Surakarta').eq('tahun', 2025).execute()
    pad_id2 = res2.data[0]['id']
    det2 = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id2).execute()
    codes2 = set(d['kategori_kode'] for d in det2.data)
    
    print(f"Unique Codes Sukoharjo 2024: {len(codes1)}")
    print(f"Unique Codes Surakarta 2025: {len(codes2)}")
    
    missing = codes1 - codes2
    print(f"Codes in Sukoharjo but NOT in Surakarta: {len(missing)}")
    if missing:
        print(f"Sample missing: {list(missing)[:5]}")

analyze_diff()
