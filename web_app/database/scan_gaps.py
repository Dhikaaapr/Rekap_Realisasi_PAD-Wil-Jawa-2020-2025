
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

JAWA_KABKOTA = [
    'bandung', 'bogor', 'bekasi', 'depok', 'cimahi', 'tasikmalaya', 'cirebon', 'sukabumi', 'banjar', 'cianjur', 'garut', 'indramayu', 'karawang', 'kuningan', 'majalengka', 'pangandaran', 'purwakarta', 'subang', 'sumedang', 'ciamis',
    'tangerang', 'serang', 'cilegon', 'lebak', 'pandeglang',
    'jakarta', 'kepulauan seribu',
    'semarang', 'surakarta', 'solo', 'magelang', 'pekalongan', 'salatiga', 'tegal', 'banyumas', 'batang', 'blora', 'boyolali', 'brebes', 'cilacap', 'demak', 'grobogan', 'jepara', 'kebumen', 'kendal', 'klaten', 'kudus', 'pati', 'pemalang', 'purbalingga', 'purworejo', 'rembang', 'sragen', 'sukoharjo', 'temanggung', 'wonogiri', 'wonosobo', 'banjarnegara', 'karanganyar',
    'yogyakarta', 'sleman', 'bantul', 'kulon progo', 'gunung kidul',
    'surabaya', 'malang', 'batu', 'blitar', 'kediri', 'madiun', 'mojokerto', 'pasuruan', 'probolinggo', 'bangkalan', 'banyuwangi', 'bojonegoro', 'bondowoso', 'gresik', 'jember', 'jombang', 'lamongan', 'lumajang', 'magetan', 'nganjuk', 'ngawi', 'pacitan', 'pamekasan', 'ponorogo', 'sampang', 'sidoarjo', 'situbondo', 'sumenep', 'trenggalek', 'tuban', 'tulungagung'
]

def is_jawa(daerah):
    if not daerah: return False
    lower = daerah.lower()
    return any(k in lower for k in JAWA_KABKOTA) or any(k in lower for k in ['jawa barat', 'jawa tengah', 'jawa timur', 'banten', 'dki jakarta', 'di yogyakarta'])

def scan_gaps():
    print("Scanning for gaps in Jawa regions...")
    res = supabase.table('pad_data').select('id, daerah, tahun').execute()
    all_recs = res.data
    
    jawa_recs = [r for r in all_recs if is_jawa(r['daerah'])]
    print(f"Total Jawa records: {len(jawa_recs)}")
    
    gaps = []
    for r in jawa_recs:
        count_res = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', r['id']).execute()
        if count_res.count == 0:
            gaps.append(r)
            
    print(f"Found {len(gaps)} records with ZERO details.")
    if gaps:
        print("Sample gaps:")
        for g in gaps[:10]:
            print(f"  {g['daerah']} - {g['tahun']}")

scan_gaps()
