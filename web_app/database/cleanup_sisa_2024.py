from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

TAHUN = 2024

print("=== Hapus sisa invalid wilayah 2024 ===")
# Menghapus duplikat tanpa prefix, dan non-Jawa (Solok)
invalid_sisa = ['Kab. Solok', 'Kab. Solok Selatan', 'DKI Jakarta', 'DI Yogyakarta']

for name in invalid_sisa:
    res = supabase.table('pad_data').select('id').eq('tahun', TAHUN).eq('daerah', name).execute()
    if res.data:
        pad_id = res.data[0]['id']
        supabase.table('detail_pad_data').delete().eq('pad_data_id', pad_id).execute()
        supabase.table('pad_data').delete().eq('id', pad_id).execute()
        print(f"  Deleted: {name}")

print("\n=== HASIL AKHIR DATA 2024 ===")
final = supabase.table('pad_data').select('daerah, pajak_realisasi').eq('tahun', TAHUN).execute()
nonzero = [d for d in final.data if (d.get('pajak_realisasi') or 0) > 0]
print(f"Total wilayah 2024 Jawa yang valid: {len(final.data)}")
print(f"Wilayah yang sudah ada datanya  : {len(nonzero)}")
print(f"Wilayah yang datanya masih 0    : {len(final.data) - len(nonzero)}")
