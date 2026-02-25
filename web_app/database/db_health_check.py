
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_db_health():
    # Count pad_data
    res = supabase.table('pad_data').select('count', count='exact').execute()
    print(f"Total rows in pad_data: {res.count}")
    
    # Check 2024 data (should be there)
    res2 = supabase.table('pad_data').select('id').eq('tahun', 2024).limit(5).execute()
    print(f"Sample 2024 records count: {len(res2.data)}")
    
    # Check for empty daerah
    res3 = supabase.table('pad_data').select('id').is_('daerah', 'null').execute()
    print(f"Records with null daerah: {len(res3.data)}")

check_db_health()
