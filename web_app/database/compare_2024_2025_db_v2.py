
from supabase import create_client, Client
import pandas as pd
import sys

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def compare_sukoharjo_db(years=[2024, 2025]):
    with open('comparison_output.txt', 'w') as f:
        sys.stdout = f
        for y in years:
            print(f"\n--- Checking Sukoharjo {y} in Database ---")
            res = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Sukoharjo').eq('tahun', y).execute()
            if not res.data:
                print(f"No pad_data for {y}")
                continue
                
            pad_id = res.data[0]['id']
            det = supabase.table('detail_pad_data').select('kategori_kode, anggaran, realisasi').eq('pad_data_id', pad_id).execute()
            df = pd.DataFrame(det.data)
            
            print(f"Total Rows: {len(df)}")
            if not df.empty:
                df['segments'] = df['kategori_kode'].str.split('.').str.len()
                print(f"Max depth level: {df['segments'].max()}")
                print(f"Segments distribution:\n{df['segments'].value_counts().sort_index()}")
                
                # Check for children of PBJT (starts with 4.1.0.1.0.19.0)
                pbjt_children = df[df['kategori_kode'].str.startswith('4.1.0.1.0.19.0')]
                print(f"PBJT related rows: {len(pbjt_children)}")
        sys.stdout = sys.__stdout__

compare_sukoharjo_db()
