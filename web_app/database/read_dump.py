import json

with open('detail_dump.json', encoding='utf-8') as f:
    d = json.load(f)

print('=== COUNTS PER YEAR ===')
for y, c in d['counts'].items():
    print(f'  {y}: pad_data={c["pad_data"]}, detail_pad_data={c["detail_pad_data"]}')

print()
print('=== KODE STATS ===')
ks = d['kode_stats']
print(f'  Total unique kodes (sample): {ks["total"]}')
print(f'  Max depth: {ks["max_depth"]}')
print(f'  Per level: {ks["per_level"]}')
print(f'  Sample kodes first 20: {ks["all_kodes"][:20]}')

print()
print('=== REF KATEGORI SAMPLE (first 40) ===')
for r in d['ref_kategori'][:40]:
    kode = r.get('kode', '')
    lvl = len(kode.split('.')) if kode else 0
    indent = '  ' * lvl
    nama = r.get('nama', '')[:60]
    kat = r.get('kategori_utama', '')
    print(f'  [{kode:<12}] {indent}{nama} | {kat}')

print()
print('=== SAMPLE DKI/FIRST REGION 2025 (first 40 rows) ===')
samp = d['sample_dki_2025']
print(f'  Daerah: {samp["daerah"]}, Count: {samp["count"]}')
for row in samp['data'][:40]:
    kode = row.get('kategori_kode', '')
    lvl = len(kode.split('.')) if kode else 0
    indent = '  ' * lvl
    ref = row.get('ref_kategori_pad') or {}
    nama = ref.get('nama', '?')[:50]
    ang = row.get('anggaran') or 0
    real = row.get('realisasi') or 0
    print(f'  [{kode:<12}] {indent}{nama:<50} | Ang:{ang/1e9:>8.2f}M | Real:{real/1e9:>8.2f}M')
