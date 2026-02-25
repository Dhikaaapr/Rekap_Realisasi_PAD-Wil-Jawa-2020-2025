
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def compare_sukoharjo_db(years=[2024, 2025]):
    for y in years:
        print(f"\n--- Checking Sukoharjo {y} in Database ---")
        res = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Sukoharjo').eq('tahun', y).execute()
        if not res.data:
            print(f"No pad_data for {y}")
            continue
            
        pad_id = res.data[0]['id']
        det = supabase.table('detail_pad_data').select('kategori_kode, anggaran, realisasi, ref_kategori_pad(nama)').eq('pad_data_id', pad_id).execute()
        df = pd.DataFrame(det.data)
        
        print(f"Total Rows: {len(df)}")
        if not df.empty:
            # Check for PBJT (4.1.0.1.0.19.0)
            pbjt = df[df['kategori_kode'].str.contains('4.1.0.1.0.19.0', na=False)]
            print(f"PBJT Rows found: {len(pbjt)}")
            
            # Check for children of PBJT
            pbjt_children = df[df['kategori_kode'].str.startswith('4.1.0.1.0.19.0.')]
            print(f"PBJT Children count: {len(pbjt_children)}")
            
            # Print sample of leaf nodes
            # Heuristic: codes with many segments
            df['segments'] = df['kategori_kode'].str.split('.').str.len()
            print(f"Max depth level: {df['segments'].max()}")
            deep_rows = df[df['segments'] >= 6].head(5)
            print("Deep rows sample:")
            print(deep_rows[['kategori_kode', 'anggaran', 'realisasi']])

compare_sukoharjo_db()
