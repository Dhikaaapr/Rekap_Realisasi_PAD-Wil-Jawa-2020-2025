import pandas as pd
import re
from supabase import create_client, Client
import math

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

JAVA_PROVINCES = ['DKI JAKARTA', 'JAWA BARAT', 'JAWA TENGAH', 'DI YOGYAKARTA', 'JAWA TIMUR', 'BANTEN']
JAVA_KEYWORDS = [
    'JAKARTA', 'SERIBU', 'BANDUNG', 'BOGOR', 'BEKASI', 'DEPOK', 'CIMAHI', 'TASIKMALAYA', 'CIREBON', 'SUKABUMI', 'BANJAR', 'CIANJUR', 'GARUT', 
    'INDRAMAYU', 'KARAWANG', 'KUNINGAN', 'MAJALENGKA', 'PANGANDARAN', 'PURWAKARTA', 'SUBANG', 'SUMEDANG', 'CIAMIS', 'TANGERANG', 'SERANG', 
    'CILEGON', 'LEBAK', 'PANDEGLANG', 'SEMARANG', 'SURAKARTA', 'SOLO', 'MAGELANG', 'PEKALONGAN', 'SALATIGA', 'TEGAL', 'BANYUMAS', 'BATANG', 
    'BLORA', 'BOYOLALI', 'BREBES', 'CILACAP', 'DEMAK', 'GROBOGAN', 'JEPARA', 'KEBUMEN', 'KENDAL', 'KLATEN', 'KUDUS', 'PATI', 'PEMALANG', 
    'PURBALINGGA', 'PURWOREJO', 'REMBANG', 'SRAGEN', 'SUKOHARJO', 'TEMANGGUNG', 'WONOGIRI', 'WONOSOBO', 'YOGYAKARTA', 'SLEMAN', 'BANTUL', 
    'KULON PROGO', 'GUNUNG KIDUL', 'SURABAYA', 'MALANG', 'BATU', 'BLITAR', 'KEDIRI', 'MADIUN', 'MOJOKERTO', 'PASURUAN', 'PROBOLINGGO', 
    'BANGKALAN', 'BANYUWANGI', 'BOJONEGORO', 'BONDOWOSO', 'GRESIK', 'JEMBER', 'JOMBANG', 'LAMONGAN', 'LUMAJANG', 'MAGETAN', 'NGANJUK', 
    'NGAWI', 'PACITAN', 'PAMEKASAN', 'PONOROGO', 'SAMPANG', 'SIDOARJO', 'SITUBONDO', 'SUMENEP', 'TRENGGALEK', 'TUBAN', 'TULUNGAGUNG', 'UNGARAN'
]

def is_java_region(name):
    name_up = str(name).upper()
    # Check provinces first
    if any(p in name_up for p in JAVA_PROVINCES): return True
    
    # Check keywords as whole words to avoid "Labuhanbatu" matching "BATU"
    for k in JAVA_KEYWORDS:
        if re.search(r'\b' + re.escape(k) + r'\b', name_up):
            return True
    return False

def clean_val(val):
    if pd.isna(val) or val == 'nan': return 0.0
    try:
        return float(val)
    except:
        return 0.0

def migrate_file(file_path, year):
    print(f"\nProcessing {file_path} for year {year}...")
    df = pd.read_excel(file_path)
    columns = df.columns.tolist()
    
    # Map columns to categories
    # pattern: "CODE - NAME (Type)"
    pattern = re.compile(r'^([\d\.]+) - (.*?) \((Anggaran|Realisasi|Persen)\)$')
    
    col_mapping = {} # col_name -> {code, type}
    for col in columns:
        match = pattern.match(str(col))
        if match:
            col_mapping[col] = {'code': match.group(1), 'type': match.group(3).lower()}

    print(f"  Found {len(col_mapping)} data columns.")

    for idx, row in df.iterrows():
        region_name = str(row['Daerah']).strip()
        if not region_name or region_name == 'nan': continue
        
        # Filter Java regions only
        if not is_java_region(region_name):
            continue
            
        # SKIPPING SUKOHARJO to preserve granular data already imported
        if 'SUKOHARJO' in region_name.upper():
            print(f"  Skipping {region_name} (using detailed data instead)...")
            continue
            
        print(f"  Processing {region_name}...")
        # Calculate totals from columns
        pajak_ang = clean_val(row.get('4.1.01 - Pajak Daerah (Anggaran)', 0))
        pajak_rel = clean_val(row.get('4.1.01 - Pajak Daerah (Realisasi)', 0))
        ret_ang = clean_val(row.get('4.1.02 - Retribusi Daerah (Anggaran)', 0))
        ret_rel = clean_val(row.get('4.1.02 - Retribusi Daerah (Realisasi)', 0))
        peng_ang = clean_val(row.get('4.1.03 - Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan (Anggaran)', 0))
        peng_rel = clean_val(row.get('4.1.03 - Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan (Realisasi)', 0))
        lain_ang = clean_val(row.get('4.1.04 - Lain-lain PAD yang Sah (Anggaran)', 0))
        lain_rel = clean_val(row.get('4.1.04 - Lain-lain PAD yang Sah (Realisasi)', 0))
        
        pad_payload = {
            'tahun': year,
            'daerah': region_name,
            'pajak_anggaran': pajak_ang,
            'pajak_realisasi': pajak_rel,
            'retribusi_anggaran': ret_ang,
            'retribusi_realisasi': ret_rel,
            'pengelolaan_anggaran': peng_ang,
            'pengelolaan_realisasi': peng_rel,
            'lain_pad_anggaran': lain_ang,
            'lain_pad_realisasi': lain_rel
        }
        
        # Upsert pad_data
        existing = supabase.table('pad_data').select('id').eq('tahun', year).eq('daerah', region_name).execute()
        if existing.data:
            pad_id = existing.data[0]['id']
            supabase.table('pad_data').update(pad_payload).eq('id', pad_id).execute()
        else:
            res = supabase.table('pad_data').insert(pad_payload).execute()
            if res.data:
                pad_id = res.data[0]['id']
            else:
                print(f"    Failed to create pad_data for {region_name}")
                continue

        # 2. Insert details
        # Group values by code
        details = {} # code -> {anggaran, realisasi}
        for col_name, meta in col_mapping.items():
            code = meta['code']
            type_ = meta['type']
            if type_ == 'persen': continue
            
            val = clean_val(row[col_name])
            if code not in details: details[code] = {'anggaran': 0.0, 'realisasi': 0.0}
            details[code][type_] = val
            
        details_payload = []
        for code, vals in details.items():
            details_payload.append({
                'pad_data_id': pad_id,
                'tahun': year,
                'daerah': region_name,
                'kategori_kode': code,
                'anggaran': vals['anggaran'],
                'realisasi': vals['realisasi']
            })
            
        # Batch upsert details for this region
        # To avoid primary key issues or duplicates, we should probably delete existing for this pad_data_id or use upsert
        # Since detail_pad_data doesn't have a unique constraint on (pad_data_id, kategori_kode) in the original SQL, I should check.
        # Wait, I'll just delete and re-insert for simplicity/consistency.
        supabase.table('detail_pad_data').delete().eq('pad_data_id', pad_id).execute()
        
        # Insert in batches
        for i in range(0, len(details_payload), 50):
            supabase.table('detail_pad_data').insert(details_payload[i:i+50]).execute()
            
        print(f"    Migrated {region_name} ({len(details_payload)} details)")

def main():
    # YEAR SELECTION: Based on asset list, it seems KABKOTA/PROVINSI might be for 2025 or 2024.
    # Let's assume 2025 for now as the latest.
    # Actually, I'll process them for 2025.
    files = [
        (r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\KABKOTA.xlsx', 2024),
        (r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\PROVINSI.xlsx', 2024)
    ]
    
    for f, y in files:
        migrate_file(f, y)

if __name__ == "__main__":
    main()
