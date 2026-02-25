
from supabase import create_client, Client
from collections import Counter

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

# The TRUE 119 Jawa regions - carefully curated
# 6 Provinsi:
#   1. DKI Jakarta
#   2. Banten  
#   3. Jawa Barat
#   4. Jawa Tengah
#   5. DI Yogyakarta
#   6. Jawa Timur
# 
# Kab/Kota breakdown:
#   DKI Jakarta: 5 Kota Adm + 1 Kab Adm = 6 (BUT the province itself is special)
#   Banten: 4 Kab + 4 Kota = 8
#   Jawa Barat: 18 Kab + 9 Kota = 27
#   Jawa Tengah: 29 Kab + 6 Kota = 35
#   DI Yogyakarta: 4 Kab + 1 Kota = 5
#   Jawa Timur: 29 Kab + 9 Kota = 38

# EXACT daerah names as they appear in the database
JAWA_119 = [
    # === 6 PROVINSI ===
    "Prov. DKI Jakarta",
    "Prov. Banten",
    "Prov. Jawa Barat", 
    "Prov. Jawa Tengah",
    "Prov. DI Yogyakarta",
    "Prov. Jawa Timur",
    
    # === DKI JAKARTA (6 kab/kota admin) ===
    "Kab. Adm. Kepulauan Seribu",
    "Kota Adm. Jakarta Barat",
    "Kota Adm. Jakarta Pusat",
    "Kota Adm. Jakarta Selatan",
    "Kota Adm. Jakarta Timur",
    "Kota Adm. Jakarta Utara",
    
    # === BANTEN (4 Kab + 4 Kota = 8) ===
    "Kab. Lebak",
    "Kab. Pandeglang",
    "Kab. Serang",
    "Kab. Tangerang",
    "Kota Cilegon",
    "Kota Serang",
    "Kota Tangerang",
    "Kota Tangerang Selatan",
    
    # === JAWA BARAT (18 Kab + 9 Kota = 27) ===
    "Kab. Bandung",
    "Kab. Bandung Barat",
    "Kab. Bekasi",
    "Kab. Bogor",
    "Kab. Ciamis",
    "Kab. Cianjur",
    "Kab. Cirebon",
    "Kab. Garut",
    "Kab. Indramayu",
    "Kab. Karawang",
    "Kab. Kuningan",
    "Kab. Majalengka",
    "Kab. Pangandaran",
    "Kab. Purwakarta",
    "Kab. Subang",
    "Kab. Sukabumi",
    "Kab. Sumedang",
    "Kab. Tasikmalaya",
    "Kota Bandung",
    "Kota Banjar",
    "Kota Bekasi",
    "Kota Bogor",
    "Kota Cimahi",
    "Kota Cirebon",
    "Kota Depok",
    "Kota Sukabumi",
    "Kota Tasikmalaya",
    
    # === JAWA TENGAH (29 Kab + 6 Kota = 35) ===
    "Kab. Banjarnegara",
    "Kab. Banyumas",
    "Kab. Batang",
    "Kab. Blora",
    "Kab. Boyolali",
    "Kab. Brebes",
    "Kab. Cilacap",
    "Kab. Demak",
    "Kab. Grobogan",
    "Kab. Jepara",
    "Kab. Karanganyar",
    "Kab. Kebumen",
    "Kab. Kendal",
    "Kab. Klaten",
    "Kab. Kudus",
    "Kab. Magelang",
    "Kab. Pati",
    "Kab. Pekalongan",
    "Kab. Pemalang",
    "Kab. Purbalingga",
    "Kab. Purworejo",
    "Kab. Rembang",
    "Kab. Semarang",
    "Kab. Sragen",
    "Kab. Sukoharjo",
    "Kab. Tegal",
    "Kab. Temanggung",
    "Kab. Wonogiri",
    "Kab. Wonosobo",
    "Kota Magelang",
    "Kota Pekalongan",
    "Kota Salatiga",
    "Kota Semarang",
    "Kota Surakarta",
    "Kota Tegal",
    
    # === DI YOGYAKARTA (4 Kab + 1 Kota = 5) ===
    "Kab. Bantul",
    "Kab. Gunung Kidul",
    "Kab. Kulon Progo",
    "Kab. Sleman",
    "Kota Yogyakarta",
    
    # === JAWA TIMUR (29 Kab + 9 Kota = 38) ===
    "Kab. Bangkalan",
    "Kab. Banyuwangi",
    "Kab. Blitar",
    "Kab. Bojonegoro",
    "Kab. Bondowoso",
    "Kab. Gresik",
    "Kab. Jember",
    "Kab. Jombang",
    "Kab. Kediri",
    "Kab. Lamongan",
    "Kab. Lumajang",
    "Kab. Madiun",
    "Kab. Magetan",
    "Kab. Malang",
    "Kab. Mojokerto",
    "Kab. Nganjuk",
    "Kab. Ngawi",
    "Kab. Pacitan",
    "Kab. Pamekasan",
    "Kab. Pasuruan",
    "Kab. Ponorogo",
    "Kab. Probolinggo",
    "Kab. Sampang",
    "Kab. Sidoarjo",
    "Kab. Situbondo",
    "Kab. Sumenep",
    "Kab. Trenggalek",
    "Kab. Tuban",
    "Kab. Tulungagung",
    "Kota Batu",
    "Kota Blitar",
    "Kota Kediri",
    "Kota Madiun",
    "Kota Malang",
    "Kota Mojokerto",
    "Kota Pasuruan",
    "Kota Probolinggo",
    "Kota Surabaya",
]

# Also map alternate names that appear in DB
ALTERNATE_NAMES = {
    "Provinsi DKI Jakarta": "Prov. DKI Jakarta",
    "Provinsi Banten": "Prov. Banten",
    "Provinsi Jawa Barat": "Prov. Jawa Barat",
    "Provinsi Jawa Tengah": "Prov. Jawa Tengah",
    "Provinsi DI Yogyakarta": "Prov. DI Yogyakarta",
    "Provinsi Jawa Timur": "Prov. Jawa Timur",
    "DI Yogyakarta": "Prov. DI Yogyakarta",
    "DKI Jakarta": "Prov. DKI Jakarta",
}

def verify():
    # Count
    provs = [d for d in JAWA_119 if d.startswith("Prov.")]
    kab_kota = [d for d in JAWA_119 if not d.startswith("Prov.")]
    
    print(f"Total JAWA_119: {len(JAWA_119)}")
    print(f"  Provinsi: {len(provs)}")
    print(f"  Kab/Kota: {len(kab_kota)}")
    
    # Verify against DB
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
    
    all_daerah_db = sorted(set(r['daerah'] for r in all_data))
    
    # Check which JAWA_119 are NOT in DB
    jawa_set = set(JAWA_119)
    alt_targets = set(ALTERNATE_NAMES.values())
    
    not_in_db = []
    for d in JAWA_119:
        if d not in all_daerah_db:
            not_in_db.append(d)
    
    if not_in_db:
        print(f"\n⚠️ {len(not_in_db)} JAWA_119 entries NOT found in DB:")
        for d in not_in_db:
            print(f"  {d}")
    else:
        print("\n✅ All JAWA_119 entries found in DB!")
    
    # Check which DB entries are Jawa but NOT in our list
    all_names = set(JAWA_119) | set(ALTERNATE_NAMES.keys())
    in_db_but_not_in_list = []
    for d in all_daerah_db:
        if d in all_names:
            continue
        # Check if it might be a Jawa region we missed
        lower = d.lower()
        jawa_keywords = ['jawa', 'jakarta', 'banten', 'yogyakarta', 'diy']
        if any(k in lower for k in jawa_keywords):
            in_db_but_not_in_list.append(d)
    
    if in_db_but_not_in_list:
        print(f"\n⚠️ DB entries that look Jawa but NOT in JAWA_119:")
        for d in in_db_but_not_in_list:
            print(f"  {d}")
    
    # Per year coverage
    print("\n=== Per year coverage for JAWA_119 ===")
    for y in sorted(set(r['tahun'] for r in all_data)):
        if y > 2025:
            continue
        year_daerah = set(r['daerah'] for r in all_data if r['tahun'] == y)
        # Normalize alternate names
        normalized = set()
        for d in year_daerah:
            if d in ALTERNATE_NAMES:
                normalized.add(ALTERNATE_NAMES[d])
            else:
                normalized.add(d)
        
        found = normalized & jawa_set
        missing = jawa_set - found
        print(f"  {y}: {len(found)}/{len(JAWA_119)} found, {len(missing)} missing")
        if missing and len(missing) < 20:
            for m in sorted(missing):
                print(f"    MISSING: {m}")

verify()
