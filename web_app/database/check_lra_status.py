"""
Check current LRA detail data status in Supabase
"""
import requests
import json

SUPABASE_URL = 'https://xerkytrweahuniqrnabi.supabase.co'
SUPABASE_KEY = 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
}

print("=" * 80)
print("LRA DETAIL DATA STATUS CHECK")
print("=" * 80)

for year in [2021, 2022, 2023, 2024, 2025]:
    # Count detail rows
    resp = requests.get(
        SUPABASE_URL + '/rest/v1/detail_pad_data?select=id&tahun=eq.' + str(year),
        headers={**headers, 'Range': '0-0'}
    )
    detail_range = resp.headers.get('content-range', '?')
    
    # Count pad_data rows
    resp2 = requests.get(
        SUPABASE_URL + '/rest/v1/pad_data?select=id&tahun=eq.' + str(year),
        headers={**headers, 'Range': '0-0'}
    )
    pad_range = resp2.headers.get('content-range', '?')
    
    print("Year " + str(year) + ": pad_data=" + str(pad_range) + ", detail_pad_data=" + str(detail_range))

print()
print("=" * 80)
print("DETAIL BREAKDOWN PER REGION PER YEAR")
print("=" * 80)

for year in [2021, 2022, 2023, 2024, 2025]:
    all_details = []
    offset = 0
    while True:
        resp = requests.get(
            SUPABASE_URL + '/rest/v1/detail_pad_data?select=daerah,kategori_kode&tahun=eq.' + str(year) + '&order=daerah&offset=' + str(offset) + '&limit=1000',
            headers=headers
        )
        batch = resp.json()
        if not batch:
            break
        all_details.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    
    regions = {}
    for d in all_details:
        r = d['daerah']
        regions[r] = regions.get(r, 0) + 1
    
    granular = sum(1 for c in regions.values() if c > 4)
    basic = sum(1 for c in regions.values() if c <= 4)
    
    print("\nYear " + str(year) + ": " + str(len(regions)) + " regions total | " + str(granular) + " granular (>4 rows) | " + str(basic) + " basic (<=4 rows)")
    
    # Show regions with only basic detail (need more detail)
    basic_regions = sorted([r for r, c in regions.items() if c <= 4])
    if basic_regions:
        print("  BASIC ONLY (need rincian): " + str(basic_regions[:10]))
    
    # Show a few granular
    granular_regions = sorted([(r, c) for r, c in regions.items() if c > 4], key=lambda x: -x[1])
    if granular_regions:
        print("  TOP GRANULAR: " + ", ".join([r + "(" + str(c) + ")" for r, c in granular_regions[:5]]))

# Check pad_data regions that have NO detail at all
print()
print("=" * 80)
print("REGIONS IN pad_data BUT NO detail_pad_data")
print("=" * 80)

for year in [2021, 2022, 2023, 2024, 2025]:
    # Get pad_data regions
    resp = requests.get(
        SUPABASE_URL + '/rest/v1/pad_data?select=daerah&tahun=eq.' + str(year) + '&limit=500',
        headers=headers
    )
    pad_regions = set(d['daerah'] for d in resp.json())
    
    # Get detail regions
    resp2 = requests.get(
        SUPABASE_URL + '/rest/v1/detail_pad_data?select=daerah&tahun=eq.' + str(year) + '&limit=5000',
        headers=headers
    )
    detail_regions = set(d['daerah'] for d in resp2.json())
    
    missing = pad_regions - detail_regions
    if missing:
        print("Year " + str(year) + " missing detail: " + str(sorted(missing)[:10]))
    else:
        print("Year " + str(year) + ": All pad_data regions have details")

# Check ref_kategori_pad
print()
print("=" * 80)
print("KATEGORI REFERENCE")
print("=" * 80)
resp = requests.get(
    SUPABASE_URL + '/rest/v1/ref_kategori_pad?select=kode,nama,level,kategori_utama&order=kode&limit=200',
    headers=headers
)
cats = resp.json()
print("Total categories: " + str(len(cats)))
for cat in cats:
    indent = "  " * (cat.get('level', 1) - 1)
    print(indent + "[" + cat['kode'] + "] " + cat['nama'] + " (level=" + str(cat.get('level', '?')) + ", " + cat.get('kategori_utama', '?') + ")")
