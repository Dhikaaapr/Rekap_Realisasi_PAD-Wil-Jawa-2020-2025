"""
Check total detail rows per region for 2024, and check code format
"""
import requests

SUPABASE_URL = 'https://xerkytrweahuniqrnabi.supabase.co'
SUPABASE_KEY = 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
}

# Total count for 2024
resp = requests.get(
    f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=id&tahun=eq.2024',
    headers={**headers, 'Range': '0-0'}
)
total = resp.headers.get('content-range', '?')
print(f"Total 2024 rows: {total}")

# Check distinct daerah for ALL years by getting daerah names from pad_data
pad_resp = requests.get(
    f'{SUPABASE_URL}/rest/v1/pad_data?select=daerah,tahun&limit=2000',
    headers={**headers}
)
pad_data = pad_resp.json()
regions_pad = sorted(set(d['daerah'] for d in pad_data))
print(f"\nRegions in pad_data: {len(regions_pad)}")
for r in regions_pad[:5]:
    print(f"  pad_data: '{r}'")

# Check daerah names in detail_pad_data for 2025
detail_resp = requests.get(
    f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=daerah&tahun=eq.2025&limit=3000',
    headers={**headers}
)
detail_data = detail_resp.json()
regions_detail = sorted(set(d['daerah'] for d in detail_data))
print(f"\nRegions in detail_pad_data (2025): {len(regions_detail)}")
for r in regions_detail[:10]:
    print(f"  detail: '{r}'")

# Check sample detail for Kab. Bangkalan 2025
resp2 = requests.get(
    f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=kategori_kode,anggaran,realisasi,ref_kategori_pad(nama)&tahun=eq.2025&daerah=eq.Kab. Bangkalan&order=kategori_kode&limit=200',
    headers={**headers}
)
d2025 = resp2.json()
print(f"\nKab. Bangkalan 2025 detail count: {len(d2025)}")
for d in d2025[:20]:
    kode = d.get('kategori_kode','')
    ref = d.get('ref_kategori_pad',{})
    nama = ref.get('nama','??') if ref else '??'
    print(f"  [{kode}] {nama}")

# Also check 2021
resp3 = requests.get(
    f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=daerah&tahun=eq.2021&limit=5000',
    headers={**headers}
)
d2021 = resp3.json()
regions_2021 = sorted(set(d['daerah'] for d in d2021))
print(f"\nRegions in detail 2021: {len(regions_2021)}")
for r in regions_2021[:10]:
    count = sum(1 for d in d2021 if d['daerah'] == r)
    print(f"  '{r}': {count} rows")
