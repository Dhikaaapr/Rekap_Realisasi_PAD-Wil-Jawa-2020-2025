
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def analyze_surakarta():
    res = supabase.table('pad_data').select('id').eq('daerah', 'Kota Surakarta').eq('tahun', 2024).execute()
    pad_id = res.data[0]['id']
    det = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id).execute()
    codes = set(d['kategori_kode'] for d in det.data)
    print(f"Surakarta 2024 Total Rows: {len(det.data)}")
    print(f"Surakarta 2024 Unique Codes: {len(codes)}")
    
    # Check Sukoharjo
    res2 = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2024).execute()
    pad_id2 = res2.data[0]['id']
    det2 = supabase.table('detail_pad_data').select('kategori_kode').eq('pad_data_id', pad_id2).execute()
    codes2 = set(d['kategori_kode'] for d in det2.data)
    print(f"Sukoharjo 2024 Unique Codes: {len(codes2)}")

analyze_surakarta()
