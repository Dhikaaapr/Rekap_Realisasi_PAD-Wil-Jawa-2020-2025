from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

# Cek jumlah record per tahun di pad_data
print("=== JUMLAH DATA PER TAHUN DI pad_data ===")
for year in [2021, 2022, 2023, 2024, 2025]:
    res = supabase.table('pad_data').select('id, daerah').eq('tahun', year).execute()
    print(f"  Tahun {year}: {len(res.data)} wilayah")

print()
print("=== DAFTAR WILAYAH YANG PUNYA DATA 2024 ===")
res2024 = supabase.table('pad_data').select('daerah, pajak_realisasi, retribusi_realisasi').eq('tahun', 2024).order('daerah').execute()
print(f"Total: {len(res2024.data)} wilayah\n")
for d in res2024.data:
    total = (d.get('pajak_realisasi') or 0) + (d.get('retribusi_realisasi') or 0)
    print(f"  {d['daerah']} (Rp {total/1e9:.1f}M)")

print()
print("=== CEK DATA DETAIL 2024 DI detail_pad_data ===")
res_det = supabase.table('detail_pad_data').select('daerah', count='exact').eq('tahun', 2024).execute()
print(f"  Total baris detail 2024: {res_det.count}")
