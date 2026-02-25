
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_bangkalan():
    res = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Bangkalan').eq('tahun', 2029).execute()
    if res.data:
        pad_id = res.data[0]['id']
        det = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
        print(f"Bangkalan 2029 count: {det.count}")
    else:
        print("Bangkalan 2029 pad_data not found")

check_bangkalan()
