from supabase import create_client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
sb = create_client(url, key)

results = {}

# Count per year
for y in [2021,2022,2023,2024,2025]:
    m = sb.table('pad_data').select('id', count='exact').eq('tahun', y).execute()
    d = sb.table('detail_pad_data').select('id', count='exact').eq('tahun', y).execute()
    results[f"tahun_{y}"] = {"pad_data": m.count, "detail_pad_data": d.count}

# Get all unique kategori_kode from detail_pad_data
all_kodes = sb.table('detail_pad_data').select('kategori_kode').limit(1000).execute()
kodes = list(set(r['kategori_kode'] for r in all_kodes.data if r.get('kategori_kode')))
kodes.sort()

max_depth = max(len(k.split('.')) for k in kodes) if kodes else 0
levels = {}
for k in kodes:
    lvl = len(k.split('.'))
    levels[lvl] = levels.get(lvl, 0) + 1

results["unique_kodes_sample"] = kodes[:30]
results["total_unique_kodes"] = len(kodes)
results["max_depth_level"] = max_depth
results["level_distribution"] = levels

# Get ref_kategori_pad
cats = sb.table('ref_kategori_pad').select('kode,nama,kategori_utama').order('kode').execute()
results["ref_count"] = len(cats.data)
results["ref_sample"] = cats.data[:30]

# Get sample detail for one region
sample = sb.table('detail_pad_data').select('daerah,tahun').limit(1).execute()
if sample.data:
    sd = sample.data[0]['daerah']
    sy = sample.data[0]['tahun']
    det = sb.table('detail_pad_data').select('kategori_kode,anggaran,realisasi').eq('daerah', sd).eq('tahun', sy).order('kategori_kode').execute()
    results["sample_region"] = sd
    results["sample_year"] = sy
    results["sample_detail"] = det.data[:50]

print(json.dumps(results, indent=2, ensure_ascii=False, default=str))
