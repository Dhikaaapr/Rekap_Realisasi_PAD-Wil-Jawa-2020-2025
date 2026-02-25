
from supabase import create_client, Client
from collections import Counter

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def check_all():
    all_data = []
    offset = 0
    page_size = 1000
    while True:
        res = supabase.table('pad_data').select('id, daerah, tahun').order('daerah').range(offset, offset + page_size - 1).execute()
        if not res.data:
            break
        all_data.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size
    
    with open('dup_report.txt', 'w', encoding='utf-8') as f:
        f.write(f"Total records in pad_data: {len(all_data)}\n\n")
        
        # Count per year
        year_counts = Counter(r['tahun'] for r in all_data)
        f.write("=== Records per year ===\n")
        for y in sorted(year_counts.keys()):
            f.write(f"  {y}: {year_counts[y]} records\n")
        
        # Find ALL unique daerah names
        all_daerah = sorted(set(r['daerah'] for r in all_data))
        f.write(f"\n=== Unique daerah names: {len(all_daerah)} ===\n")
        for d in all_daerah:
            f.write(f"  {d}\n")
        
        # Check for duplicates (same daerah + tahun)
        f.write("\n=== Checking for duplicates (same daerah + tahun) ===\n")
        dup_check = Counter((r['daerah'], r['tahun']) for r in all_data)
        dups = [(k, v) for k, v in dup_check.items() if v > 1]
        if dups:
            f.write(f"Found {len(dups)} duplicate daerah+tahun combos:\n")
            for (daerah, tahun), count in sorted(dups):
                f.write(f"  {daerah} | {tahun} -> {count} records\n")
        else:
            f.write("No duplicates found!\n")
        
        # Jawa regions detection
        JAWA_KABKOTA = [
            'bandung', 'bandung barat', 'bogor', 'bekasi', 'depok', 'cimahi', 'tasikmalaya',
            'cirebon', 'sukabumi', 'banjar', 'cianjur', 'garut', 'indramayu', 'karawang',
            'kuningan', 'majalengka', 'pangandaran', 'purwakarta', 'subang', 'sumedang', 'ciamis',
            'tangerang', 'serang', 'cilegon', 'lebak', 'pandeglang',
            'jakarta', 'kepulauan seribu',
            'semarang', 'surakarta', 'solo', 'magelang', 'pekalongan', 'salatiga', 'tegal',
            'banyumas', 'batang', 'blora', 'boyolali', 'brebes', 'cilacap', 'demak', 'grobogan',
            'jepara', 'kebumen', 'kendal', 'klaten', 'kudus', 'pati', 'pemalang', 'purbalingga',
            'purworejo', 'rembang', 'sragen', 'sukoharjo', 'temanggung', 'wonogiri', 'wonosobo',
            'banjarnegara', 'karanganyar',
            'yogyakarta', 'sleman', 'bantul', 'kulon progo', 'gunung kidul',
            'surabaya', 'malang', 'batu', 'blitar', 'kediri', 'madiun', 'mojokerto',
            'pasuruan', 'probolinggo', 'bangkalan', 'banyuwangi', 'bojonegoro', 'bondowoso',
            'gresik', 'jember', 'jombang', 'lamongan', 'lumajang', 'magetan', 'nganjuk',
            'ngawi', 'pacitan', 'pamekasan', 'ponorogo', 'sampang', 'sidoarjo', 'situbondo',
            'sumenep', 'trenggalek', 'tuban', 'tulungagung',
        ]
        JAWA_PROV_KEYWORDS = ['jawa barat', 'jawa tengah', 'jawa timur', 'banten', 'dki jakarta', 'di yogyakarta', 'yogyakarta']
        NON_JAWA_EXCLUSIONS = ['batu bara', 'banjar baru', 'banjarbaru']
        
        def is_jawa(daerah):
            if not daerah: return False
            lower = daerah.lower()
            if lower == 'jumlah' or 'total' in lower: return False
            if any(ex in lower for ex in NON_JAWA_EXCLUSIONS): return False
            if any(k in lower for k in JAWA_PROV_KEYWORDS): return True
            return any(k in lower for k in JAWA_KABKOTA)
        
        # Count Jawa vs Non-Jawa per year
        f.write("\n=== Jawa filter results per year ===\n")
        for y in sorted(year_counts.keys()):
            year_recs = [r for r in all_data if r['tahun'] == y]
            jawa_recs = [r for r in year_recs if is_jawa(r['daerah'])]
            non_jawa = [r for r in year_recs if not is_jawa(r['daerah'])]
            f.write(f"  {y}: Total={len(year_recs)}, Jawa={len(jawa_recs)}, Non-Jawa={len(non_jawa)}\n")
        
        # List all Jawa regions uniquely
        jawa_daerah = sorted(set(r['daerah'] for r in all_data if is_jawa(r['daerah'])))
        f.write(f"\n=== Jawa daerah detected ({len(jawa_daerah)} unique names) ===\n")
        for i, d in enumerate(jawa_daerah, 1):
            f.write(f"  {i:3}. {d}\n")
        
        # Check for false positives (non-Jawa that slip through)
        f.write("\n=== Potential false positives in Jawa filter ===\n")
        for d in jawa_daerah:
            lower = d.lower()
            # If it matches kabkota but might be outside Jawa
            if 'banjar' in lower and 'banjarnegara' not in lower and 'tangerang' not in lower:
                f.write(f"  SUSPICIOUS: {d} (matches 'banjar' but might be Kalimantan)\n")
            if 'malang' in lower and 'majalengka' not in lower:
                pass  # Malang is Jawa Timur
            if 'batu' in lower and 'batu bara' not in lower:
                if 'kab. batu' in lower or 'kota batu' in lower:
                    pass  # Batu is Jawa Timur
        
        # Count unique Jawa daerah per year
        f.write("\n=== Unique Jawa daerah per year ===\n")
        for y in sorted(year_counts.keys()):
            year_jawa = set(r['daerah'] for r in all_data if r['tahun'] == y and is_jawa(r['daerah']))
            f.write(f"  {y}: {len(year_jawa)} unique Jawa daerah\n")
        
        # Check for daerah name variations (normalization issues)
        f.write("\n=== Checking for name variations ===\n")
        # Group by simplified name 
        from collections import defaultdict
        simplified = defaultdict(list)
        for d in all_daerah:
            key = d.lower().replace('prov. ', '').replace('provinsi ', '').replace('kab. ', '').replace('kabupaten ', '').replace('kota ', '').strip()
            simplified[key].append(d)
        
        for key, variants in sorted(simplified.items()):
            if len(variants) > 1:
                f.write(f"  '{key}' has {len(variants)} variants: {variants}\n")

    print("Report written to dup_report.txt")

check_all()
