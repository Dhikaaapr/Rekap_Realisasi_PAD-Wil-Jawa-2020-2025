"""
Check Jawa region detail data for 2024 - with full hierarchy sample
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

# Jawa regions in pad_data
jawa_provinsi = ['Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. Jawa Timur', 
                 'Prov. Banten', 'Prov. DKI Jakarta', 'Prov. DI Yogyakarta']

# Check detail for each year, looking for Jawa kabupaten
for year in [2021, 2022, 2023, 2024, 2025]:
    # Get all details for this year, paginated
    all_details = []
    offset = 0
    while True:
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=daerah,kategori_kode&tahun=eq.{year}&order=daerah,kategori_kode&offset={offset}&limit=1000',
            headers=headers
        )
        batch = resp.json()
        if not batch:
            break
        all_details.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    
    regions = sorted(set(d['daerah'] for d in all_details))
    # Filter Jawa regions (known patterns)
    jawa_regions = [r for r in regions if any(x in r for x in ['Bandung', 'Bekasi', 'Bogor', 'Ciamis', 'Cianjur', 'Cirebon', 
                    'Garut', 'Indramayu', 'Karawang', 'Kuningan', 'Majalengka', 'Pangandaran', 'Purwakarta',
                    'Subang', 'Sukabumi', 'Sumedang', 'Tasikmalaya', 'Depok', 'Semarang',
                    'Banyumas', 'Cilacap', 'Demak', 'Jepara', 'Kebumen', 'Kendal', 'Klaten', 'Kudus',
                    'Magelang', 'Pati', 'Pekalongan', 'Pemalang', 'Purbalingga', 'Purworejo',
                    'Rembang', 'Sragen', 'Sukoharjo', 'Tegal', 'Temanggung', 'Wonogiri', 'Wonosobo',
                    'Solo', 'Surakarta', 'Salatiga',
                    'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik',
                    'Jember', 'Jombang', 'Kediri', 'Lamongan', 'Lumajang', 'Madiun', 'Magetan',
                    'Malang', 'Mojokerto', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan',
                    'Ponorogo', 'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep',
                    'Trenggalek', 'Tuban', 'Tulungagung', 'Surabaya', 'Batu',
                    'Serang', 'Tangerang', 'Lebak', 'Pandeglang', 'Cilegon',
                    'Jakarta', 'Yogyakarta', 'Bantul', 'Sleman', 'Kulon Progo', 'Gunungkidul',
                    'Batang', 'Brebes', 'Blora', 'Boyolali', 'Karanganyar', 'Grobogan'])]
    
    print(f"\n=== {year}: {len(all_details)} total rows, {len(regions)} regions, {len(jawa_regions)} Jawa regions ===")
    for r in jawa_regions[:5]:
        count = sum(1 for d in all_details if d['daerah'] == r)
        sample_codes = sorted(set(d['kategori_kode'] for d in all_details if d['daerah'] == r))
        print(f"  {r}: {count} rows, codes: {sample_codes[:5]}...")

# Now get FULL detail for one region with the most data
print("\n\n" + "="*90)
print("FULL HIERARCHY: Kab. Bandung (2021)")
print("="*90)

resp_full = requests.get(
    f'{SUPABASE_URL}/rest/v1/detail_pad_data?select=kategori_kode,anggaran,realisasi,ref_kategori_pad(nama,kategori_utama)&tahun=eq.2021&daerah=eq.Kab. Bandung&order=kategori_kode&limit=500',
    headers=headers
)
full_data = resp_full.json()
print(f"Rows: {len(full_data)}")

def fmt(v):
    if not v: return "-"
    if v >= 1_000_000_000: return f"Rp {v/1_000_000_000:.1f}M"
    elif v >= 1_000_000: return f"Rp {v/1_000_000:.0f}Jt"
    elif v > 0: return f"Rp {v:,.0f}"
    return "-"

for d in full_data:
    kode = d.get('kategori_kode', '')
    ref = d.get('ref_kategori_pad', {})
    nama = ref.get('nama', '??') if ref else '??'
    kat = ref.get('kategori_utama', '') if ref else ''
    ang = d.get('anggaran', 0) or 0
    real = d.get('realisasi', 0) or 0
    
    # determine indent based on code format
    parts = kode.split('.')
    level = len(parts) - 1
    indent = "  " * min(level, 6)
    
    print(f"{indent}[{kode}] {nama} | A:{fmt(ang)} | R:{fmt(real)}")
