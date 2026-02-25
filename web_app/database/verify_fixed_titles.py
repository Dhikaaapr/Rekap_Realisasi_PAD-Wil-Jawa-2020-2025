
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def verify_titles():
    test_codes = [
        '4.1.0.1', '4.1.0.1.0', '4.1.0.1.0.6', '4.1.0.1.0.15', '4.1.0.1.0.19',
        '4.1.0.2.0.1', '4.1.0.4.0'
    ]
    res = supabase.table('ref_kategori_pad').select('kode, nama').in_('kode', test_codes).execute()
    df = pd.DataFrame(res.data)
    print("Verification of Fixed Titles:")
    print(df.to_string())

verify_titles()
