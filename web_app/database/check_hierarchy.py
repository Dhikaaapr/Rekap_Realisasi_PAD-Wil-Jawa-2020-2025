"""
Check the full hierarchy of data in Supabase - output to file
"""
import requests
import json

SUPABASE_URL = 'https://xerkytrweahuniqrnabi.supabase.co'
SUPABASE_KEY = 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

lines = []

def log(s=""):
    lines.append(s)

# 1. Get all ref_kategori_pad
log("=" * 90)
log("REF_KATEGORI_PAD - Full Category Reference Tree")
log("=" * 90)

resp = requests.get(
    f'{SUPABASE_URL}/rest/v1/ref_kategori_pad?select=*&order=kode',
    headers=headers
)
categories = resp.json()
log(f"Total categories: {len(categories)}")
log()

for cat in categories:
    kode = cat.get('kode', '')
    nama = cat.get('nama', '')
    level = len(kode.split('.')) - 1
    indent = "  " * level
    prefix = "|- " if level > 0 else ""
    log(f"{indent}{prefix}[{kode}] {nama}")

# 2. Get detail for KOTA SEMARANG 2024
log()
log("=" * 90)
log("DETAIL_PAD_DATA - KOTA SEMARANG, 2024")
log("=" * 90)

resp2 = requests.get(
    f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=kategori_kode,anggaran,realisasi,ref_kategori_pad(nama)&tahun=eq.2024&daerah=eq.KOTA SEMARANG&order=kategori_kode&limit=500',
    headers=headers
)
details = resp2.json()
log(f"Total detail rows: {len(details)}")
log()

def fmt(v):
    if v >= 1_000_000_000:
        return f"Rp {v/1_000_000_000:.1f}M"
    elif v >= 1_000_000:
        return f"Rp {v/1_000_000:.0f}Jt"
    elif v > 0:
        return f"Rp {v:,.0f}"
    return "-"

for d in details:
    kode = d.get('kategori_kode', '')
    ref = d.get('ref_kategori_pad', {})
    nama_str = ref.get('nama', '??') if ref else '??'
    anggaran = d.get('anggaran', 0) or 0
    realisasi = d.get('realisasi', 0) or 0
    level = len(kode.split('.')) - 1
    indent = "  " * level
    prefix = "|- " if level > 0 else ""
    log(f"{indent}{prefix}[{kode}] {nama_str}  | Ang:{fmt(anggaran)} | Real:{fmt(realisasi)}")

# 3. Count per year
log()
log("=" * 90)
log("DATA COUNT PER YEAR")
log("=" * 90)
for year in [2021, 2022, 2023, 2024, 2025]:
    resp3 = requests.get(
        f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=id&tahun=eq.{year}&limit=1',
        headers={**headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0'}
    )
    count = resp3.headers.get('content-range', '?')
    log(f"  {year}: {count}")

# Write to file
output = "\n".join(lines)
with open("hierarchy_output.txt", "w", encoding="utf-8") as f:
    f.write(output)

print(f"Output written to hierarchy_output.txt ({len(lines)} lines)")
