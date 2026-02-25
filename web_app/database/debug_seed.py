
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

try:
    print("Testing insert...")
    # Try inserting a dummy row to see error, or just select one to see types
    res = supabase.table('pad_data').select('*').limit(1).execute()
    if res.data:
        print("Schema sample:", res.data[0])
    
    # Check if 'Kab. Sukoharjo' 2025 exists
    res = supabase.table('pad_data').select('*').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2025).execute()
    print("Sukoharjo 2025:", res.data)

except Exception as e:
    print(f"Error: {e}")
