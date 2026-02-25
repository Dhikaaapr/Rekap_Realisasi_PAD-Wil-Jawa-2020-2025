
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

try:
    res = supabase.table('pad_data').select('*').limit(1).execute()
    if res.data:
        for k in res.data[0].keys():
            print(k)
        
except Exception as e:
    print(f"Error: {e}")
