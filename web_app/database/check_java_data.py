
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_java_data():
    # Check Sukoharjo 2024
    res = supabase.table('pad_data').select('id, pajak_realisasi').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2024).execute()
    print(f"Sukoharjo 2024 check: {res.data}")
    
    # Check if there are many dummy regions now
    res2 = supabase.table('pad_data').select('count', count='exact').eq('tahun', 2026).execute()
    print(f"Total regions in 2026: {res2.count}")

check_java_data()
