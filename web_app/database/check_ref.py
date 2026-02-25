
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_ref_table():
    res = supabase.table('ref_kategori_pad').select('kode, nama').limit(50).execute()
    df = pd.DataFrame(res.data)
    print("Sample of ref_kategori_pad:")
    print(df.to_string())
    
    # Check for specific important parent codes
    important_codes = ['4.1.0.1.0', '4.1.0.2.0', '4.1.0.1.0.19.0', '4.1.0.4.0']
    res2 = supabase.table('ref_kategori_pad').select('*').in_('kode', important_codes).execute()
    print("\nImportant Parent Codes in DB:")
    print(pd.DataFrame(res2.data).to_string())

check_ref_table()
