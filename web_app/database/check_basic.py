import requests
import json

SUPABASE_URL = 'https://xerkytrweahuniqrnabi.supabase.co'
SUPABASE_KEY = 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
}

out = []

# Check regions with only basic detail (<=4 rows) for 2021-2024
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
    
    basic_regions = sorted([r for r, c in regions.items() if c <= 4])
    out.append(f"Year {year}: {len(basic_regions)} basic regions: {basic_regions}")

# Also check how many total entries per year in pad_data
for year in [2021, 2022, 2023, 2024, 2025]:
    resp = requests.get(
        SUPABASE_URL + '/rest/v1/pad_data?select=daerah&tahun=eq.' + str(year) + '&limit=600',
        headers=headers
    )
    pad_data = resp.json()
    pad_regions = set(d['daerah'] for d in pad_data)
    
    # Check for Java regions
    java_keywords = ['Jakarta', 'Bandung', 'Bogor', 'Bekasi', 'Depok', 'Semarang', 'Surabaya', 'Yogyakarta', 'Banten', 'Jawa']
    java_count = sum(1 for r in pad_regions if any(k.lower() in r.lower() for k in java_keywords))
    out.append(f"Year {year}: pad_data has {len(pad_regions)} regions ({java_count} Java-related)")

with open('basic_regions.py', 'w', encoding='ascii', errors='replace') as f:
    for line in out:
        f.write(line + '\n')
print("Done")
