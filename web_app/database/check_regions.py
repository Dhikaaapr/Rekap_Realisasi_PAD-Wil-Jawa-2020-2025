"""
Check what regions have detail data, and sample one with data
"""
import requests

SUPABASE_URL = 'https://xerkytrweahuniqrnabi.supabase.co'
SUPABASE_KEY = 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

# Get distinct daerah names from detail_pad_data for year 2024
resp = requests.get(
    f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=daerah&tahun=eq.2024&limit=5000',
    headers=headers
)
data = resp.json()
regions = sorted(set(d['daerah'] for d in data))
print(f"Total detail rows for 2024: {len(data)}")
print(f"Distinct regions with detail in 2024: {len(regions)}")
for r in regions[:10]:
    count = sum(1 for d in data if d['daerah'] == r)
    print(f"  {r}: {count} rows")

# Now sample one region with data
sample_region = regions[0] if regions else None
print(f"\n====== SAMPLE: {sample_region} (2024) ======")

if sample_region:
    resp2 = requests.get(
        f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=kategori_kode,anggaran,realisasi,ref_kategori_pad(nama)&tahun=eq.2024&daerah=eq.{sample_region}&order=kategori_kode&limit=500',
        headers=headers
    )
    details = resp2.json()
    
    def fmt(v):
        if not v: return "-"
        if v >= 1_000_000_000: return f"Rp {v/1_000_000_000:.1f}M"
        elif v >= 1_000_000: return f"Rp {v/1_000_000:.0f}Jt"
        elif v > 0: return f"Rp {v:,.0f}"
        return "-"

    for d in details[:80]:
        kode = d.get('kategori_kode', '')
        ref = d.get('ref_kategori_pad', {})
        nama = ref.get('nama', '??') if ref else '??'
        ang = d.get('anggaran', 0) or 0
        real = d.get('realisasi', 0) or 0
        level = len(kode.split('.')) - 1
        indent = "  " * level
        print(f"{indent}[{kode}] {nama} | A:{fmt(ang)} | R:{fmt(real)}")
    
    if len(details) > 80:
        print(f"  ... dan {len(details) - 80} baris lainnya")
