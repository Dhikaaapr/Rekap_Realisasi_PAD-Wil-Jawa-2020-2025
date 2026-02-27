from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

TAHUN = 2024

# Hapus sisa wilayah non-Jawa yang masih ada
print("=== Hapus sisa wilayah NON-JAWA dari 2024 ===")
non_jawa_sisa = ['Kota Solok', 'Kab. Batanghari', 'Kota Banjar Baru', 'Kab. Batu Bara']

for name in non_jawa_sisa:
    res = supabase.table('pad_data').select('id').eq('tahun', TAHUN).eq('daerah', name).execute()
    if res.data:
        pad_id = res.data[0]['id']
        supabase.table('detail_pad_data').delete().eq('pad_data_id', pad_id).execute()
        supabase.table('pad_data').delete().eq('id', pad_id).execute()
        print(f"  Deleted: {name}")
    else:
        print(f"  Not found: {name}")

# Cek hasil akhir bersih
print("\n=== HASIL AKHIR BERSIH DATA 2024 ===")
final = supabase.table('pad_data').select('daerah, pajak_realisasi, retribusi_realisasi')\
    .eq('tahun', TAHUN).order('pajak_realisasi', desc=True).execute()

nonzero = [d for d in final.data if (d.get('pajak_realisasi') or 0) + (d.get('retribusi_realisasi') or 0) > 0]
zero_list = [d['daerah'] for d in final.data if (d.get('pajak_realisasi') or 0) + (d.get('retribusi_realisasi') or 0) == 0]

print(f"Total wilayah 2024    : {len(final.data)}")
print(f"Dengan data           : {len(nonzero)}")
print(f"Masih nol ({len(zero_list)}): {', '.join(zero_list)}")
