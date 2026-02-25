
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def find_missing_titles():
    # 1. Get all unique kategori_kode from detail_pad_data
    print("Fetching unique codes from detail_pad_data...")
    # Using a trick to get unique codes or just sampling often used ones
    # Since we propagated everything, we have a lot.
    # Let's get distinct codes from the ref table first and compare
    
    # Actually, let's just fetch ALL from ref_kategori_pad to see what we HAVE
    res_ref = supabase.table('ref_kategori_pad').select('kode, nama').execute()
    ref_df = pd.DataFrame(res_ref.data)
    ref_codes = set(ref_df['kode'])
    
    print(f"Total entries in ref_kategori_pad: {len(ref_df)}")
    
    # 2. Sample some detail records to find codes without names in join
    print("Checking for codes in details without names...")
    # We can use a join-like query in Supabase (select with filter on related table)
    # But easier to just check a few hundred detail rows
    det = supabase.table('detail_pad_data').select('kategori_kode').limit(1000).execute()
    detail_codes = set(d['kategori_kode'] for d in det.data)
    
    missing = detail_codes - ref_codes
    print(f"Sample detail codes missing in ref table: {len(missing)}")
    if missing:
        print(f"Missing codes: {list(missing)[:10]}")
        
    # Also check if names are actually empty strings or the same as code
    same_as_code = ref_df[ref_df['nama'] == ref_df['kode']]
    print(f"Entries where name is same as code: {len(same_as_code)}")
    if not same_as_code.empty:
        print(f"Examples: {same_as_code.head(10)['kode'].tolist()}")

find_missing_titles()
