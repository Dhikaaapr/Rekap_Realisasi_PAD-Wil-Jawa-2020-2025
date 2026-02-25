
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_constraints():
    # Try to insert a duplicate and see if it fails
    # Get a pad_id from Sukoharjo 2024
    res = supabase.table('pad_data').select('id').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2024).limit(1).execute()
    pad_id = res.data[0]['id']
    
    # Try to insert a code that already exists
    dummy = {
        'pad_data_id': pad_id,
        'tahun': 2024,
        'daerah': 'Kab. Sukoharjo',
        'kategori_kode': '4.1.0.1.0',
        'anggaran': 0,
        'realisasi': 0
    }
    
    try:
        res = supabase.table('detail_pad_data').insert(dummy).execute()
        print("Insert successful (No unique constraint on kode + pad_id)")
    except Exception as e:
        print(f"Insert failed: {e}")

check_constraints()
