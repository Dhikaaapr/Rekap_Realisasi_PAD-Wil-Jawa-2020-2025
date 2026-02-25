
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_data_availability():
    years = [2021, 2022, 2023, 2024, 2025]
    regions = ['Kab. Sukoharjo', 'Kota Bandung', 'Kab. Bangkalan']
    
    for r in regions:
        print(f"\nREGION: {r}")
        for y in years:
            pd_res = supabase.table('pad_data').select('id').eq('daerah', r).eq('tahun', y).execute()
            if pd_res.data:
                pad_id = pd_res.data[0]['id']
                det_res = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
                print(f"  {y}: OK (Rincian: {det_res.count})")
            else:
                print(f"  {y}: MISSING")

check_data_availability()
