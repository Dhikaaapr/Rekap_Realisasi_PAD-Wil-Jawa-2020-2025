
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

try:
    print("Fetching one row...")
    res = supabase.table('pad_data').select('*').limit(1).execute()
    if res.data:
        print("Keys:", res.data[0].keys())
    else:
        print("Empty table")
        
except Exception as e:
    print(f"Error: {e}")
