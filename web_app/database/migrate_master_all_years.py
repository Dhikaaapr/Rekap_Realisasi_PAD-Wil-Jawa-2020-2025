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
    if any(p in name_up for p in JAVA_PROVINCES): return True
    for k in JAVA_KEYWORDS:
        if re.search(r'\b' + re.escape(k) + r'\b', name_up):
            return True
    return False

def clean_val(val):
    if pd.isna(val) or val == 'nan': return 0.0
    try:
        val_str = str(val).replace(',', '').replace('(', '-').replace(')', '')
        return float(val_str)
    except:
        return 0.0

def migrate_sheet(df, year):
    columns = df.columns.tolist()
    pattern = re.compile(r'^([\d\.]+) - (.*?) \((Anggaran|Realisasi|Persen)\)$')
    
    col_mapping = {}
    for col in columns:
        match = pattern.match(str(col))
        if match:
            col_mapping[col] = {'code': match.group(1), 'type': match.group(3).lower()}

    print(f"  Working on year {year}: Found {len(col_mapping)} data columns for {len(df)} regions.")

    for idx, row in df.iterrows():
        region_name = str(row.get('Daerah', row.iloc[0])).strip()
        if not region_name or region_name == 'nan' or 'TOTAL' in region_name.upper(): continue
        if not is_java_region(region_name): continue
        
        # 1. Main stats
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
            if res.data: pad_id = res.data[0]['id']
            else: continue

        # 2. Detail records
        details_payload = []
        # Group by code to handle Anggaran/Realisasi pairs
        code_data = {} # code -> {ang, rel}
        for col_name, meta in col_mapping.items():
            code = meta['code']
            if meta['type'] == 'persen': continue
            if code not in code_data: code_data[code] = {'ang': 0.0, 'rel': 0.0}
            val = clean_val(row[col_name])
            if meta['type'] == 'anggaran': code_data[code]['ang'] = val
            elif meta['type'] == 'realisasi': code_data[code]['rel'] = val
            
        for code, vals in code_data.items():
            if vals['ang'] == 0 and vals['rel'] == 0: continue
            details_payload.append({
                'pad_data_id': pad_id,
                'tahun': year,
                'daerah': region_name,
                'kategori_kode': code,
                'anggaran': vals['ang'],
                'realisasi': vals['rel']
            })

        # Clear old details for this region/year
        supabase.table('detail_pad_data').delete().eq('pad_data_id', pad_id).execute()
        
        # Batch insert details
        for i in range(0, len(details_payload), 100):
            supabase.table('detail_pad_data').insert(details_payload[i:i+100]).execute()
            
        print(f"    Inserted {len(details_payload)} details for {region_name}")

def main():
    paths = [
        r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\KABKOTA.xlsx',
        r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\PROVINSI.xlsx'
    ]
    
    for path in paths:
        print(f"\nProcessing workbook: {path}")
        xl = pd.ExcelFile(path)
        for sheet_name in xl.sheet_names:
            if not sheet_name.isdigit(): continue
            year = int(sheet_name)
            if year < 2021: continue
            
            df = pd.read_excel(xl, sheet_name=sheet_name)
            migrate_sheet(df, year)

if __name__ == "__main__":
    main()
