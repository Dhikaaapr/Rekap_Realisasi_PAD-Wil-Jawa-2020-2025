
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_final_count():
    # Check Kota Bandung 2024
    res = supabase.table('pad_data').select('id').eq('daerah', 'Kota Bandung').eq('tahun', 2024).execute()
    if res.data:
        pad_id = res.data[0]['id']
        det = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
        print(f"Kota Bandung 2024 Detail Count: {det.count}")

check_final_count()
