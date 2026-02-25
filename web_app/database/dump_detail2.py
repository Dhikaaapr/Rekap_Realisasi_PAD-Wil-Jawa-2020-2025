from supabase import create_client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
sb = create_client(url, key)

out = {}

# Count per year
counts = {}
for y in [2021,2022,2023,2024,2025]:
    m = sb.table('pad_data').select('id', count='exact').eq('tahun', y).execute()
    d = sb.table('detail_pad_data').select('id', count='exact').eq('tahun', y).execute()
    counts[str(y)] = {"pad_data": m.count, "detail_pad_data": d.count}
out["counts"] = counts

# All unique kodes (sample 1000)
raw = sb.table('detail_pad_data').select('kategori_kode').limit(1000).execute()
kodes = sorted(set(r['kategori_kode'] for r in raw.data if r.get('kategori_kode')))
max_depth = max(len(k.split('.')) for k in kodes) if kodes else 0
levels = {}
for k in kodes:
    lvl = len(k.split('.'))
    levels[str(lvl)] = levels.get(str(lvl), 0) + 1
out["kode_stats"] = {"total": len(kodes), "max_depth": max_depth, "per_level": levels, "all_kodes": kodes}

# ref_kategori_pad full
cats = sb.table('ref_kategori_pad').select('*').order('kode').execute()
out["ref_kategori"] = cats.data

# Sample DKI Jakarta 2025 detail full  
daerah_test = "DKI Jakarta"
det_dki = sb.table('detail_pad_data').select(
    'kategori_kode, anggaran, realisasi, ref_kategori_pad(kode, nama, kategori_utama, sub_kategori)'
).eq('daerah', daerah_test).eq('tahun', 2025).order('kategori_kode').execute()

if not det_dki.data:
    # Try first available
    fallback = sb.table('detail_pad_data').select('daerah').limit(1).execute()
    if fallback.data:
        daerah_test = fallback.data[0]['daerah']
        det_dki = sb.table('detail_pad_data').select(
            'kategori_kode, anggaran, realisasi, ref_kategori_pad(kode, nama, kategori_utama)'
        ).eq('daerah', daerah_test).eq('tahun', 2025).order('kategori_kode').execute()

out["sample_dki_2025"] = {"daerah": daerah_test, "count": len(det_dki.data), "data": det_dki.data}

with open("detail_dump.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False, default=str)

print(f"Saved to detail_dump.json")
print(f"Counts: {json.dumps(counts, indent=2)}")
print(f"Kode stats: max_depth={max_depth}, total={len(kodes)}, per_level={levels}")
print(f"Sample ({daerah_test} 2025): {len(det_dki.data)} baris")
print(f"Ref kategori: {len(cats.data)} rows")
