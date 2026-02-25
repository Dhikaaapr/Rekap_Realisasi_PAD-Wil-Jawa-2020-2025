"""
=======================================================================
COMPREHENSIVE LRA DETAIL MIGRATION
=======================================================================
Fixes all gaps in detail_pad_data for ALL years 2021-2025.

Issues found:
1. 2021-2024: 6 Provinsi Jawa + 5 Kabupaten have only 4 basic categories
   - Provinsi data exists in PROVINSI.xlsx but was not properly imported
   - 5 Kabupaten may have name mismatches in KABKOTA.xlsx
2. 2025: Only basic 4-category data from Database Rekap 2025
   - No KABKOTA.xlsx 2025 sheet exists
   - Will re-run KABKOTA import for 2021-2024 to fill gaps

Strategy:
A) Re-import from KABKOTA.xlsx (2021-2024) - fix missing Kab. regions
B) Re-import from PROVINSI.xlsx (2021-2024) - fix missing Prov. regions  
C) For 2025: The Database Rekap 2025 only has summary data, so we keep
   the 4 main categories but ensure they are complete and correct
=======================================================================
"""

import pandas as pd
import re
import math
import requests
import json
import os

# Backend configuration
BASE_URL = "http://localhost:3000/api/pad"

JAVA_PROVINCES = ['DKI JAKARTA', 'JAWA BARAT', 'JAWA TENGAH', 'DI YOGYAKARTA', 'JAWA TIMUR', 'BANTEN']
JAVA_KEYWORDS = [
    'JAKARTA', 'SERIBU', 'BANDUNG', 'BOGOR', 'BEKASI', 'DEPOK', 'CIMAHI', 'TASIKMALAYA', 'CIREBON', 'SUKABUMI', 'BANJAR', 'CIANJUR', 'GARUT',
    'INDRAMAYU', 'KARAWANG', 'KUNINGAN', 'MAJALENGKA', 'PANGANDARAN', 'PURWAKARTA', 'SUBANG', 'SUMEDANG', 'CIAMIS', 'TANGERANG', 'SERANG',
    'CILEGON', 'LEBAK', 'PANDEGLANG', 'SEMARANG', 'SURAKARTA', 'SOLO', 'MAGELANG', 'PEKALONGAN', 'SALATIGA', 'TEGAL', 'BANYUMAS', 'BATANG',
    'BLORA', 'BOYOLALI', 'BREBES', 'CILACAP', 'DEMAK', 'GROBOGAN', 'JEPARA', 'KEBUMEN', 'KENDAL', 'KLATEN', 'KUDUS', 'PATI', 'PEMALANG',
    'PURBALINGGA', 'PURWOREJO', 'REMBANG', 'SRAGEN', 'SUKOHARJO', 'TEMANGGUNG', 'WONOGIRI', 'WONOSOBO', 'YOGYAKARTA', 'SLEMAN', 'BANTUL',
    'KULON PROGO', 'GUNUNG KIDUL', 'GUNUNGKIDUL', 'SURABAYA', 'MALANG', 'BATU', 'BLITAR', 'KEDIRI', 'MADIUN', 'MOJOKERTO', 'PASURUAN', 'PROBOLINGGO',
    'BANGKALAN', 'BANYUWANGI', 'BOJONEGORO', 'BONDOWOSO', 'GRESIK', 'JEMBER', 'JOMBANG', 'LAMONGAN', 'LUMAJANG', 'MAGETAN', 'NGANJUK',
    'NGAWI', 'PACITAN', 'PAMEKASAN', 'PONOROGO', 'SAMPANG', 'SIDOARJO', 'SITUBONDO', 'SUMENEP', 'TRENGGALEK', 'TUBAN', 'TULUNGAGUNG',
    'BANJARNEGARA', 'KARANGANYAR'
]

# Target regions that are known to be missing granular detail
MISSING_BASIC_REGIONS = {
    'Kab. Demak', 'Kab. Grobogan', 'Kab. Gunung Kidul',
    'Kab. Majalengka', 'Kab. Pandeglang',
    'Prov. Banten', 'Prov. DI Yogyakarta', 'Prov. DKI Jakarta',
    'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. Jawa Timur'
}

# Name normalization mapping (KABKOTA/PROVINSI name -> DB name)
NAME_ALIASES = {
    'Kab. Gunungkidul': 'Kab. Gunung Kidul',
    'Kab. Gunung Kidul': 'Kab. Gunung Kidul',
}

def clean_val(val):
    if val is None: return 0.0
    if isinstance(val, (int, float)):
        if math.isnan(val) or math.isinf(val): return 0.0
        return float(val)
    val_str = str(val).strip().replace(',', '').replace('(', '-').replace(')', '')
    if not val_str or val_str == 'nan' or val_str == '-': return 0.0
    try:
        return float(val_str)
    except:
        return 0.0

def is_java_region(name):
    name_up = str(name).upper()
    if any(p in name_up for p in JAVA_PROVINCES): return True
    for k in JAVA_KEYWORDS:
        if re.search(r'\b' + re.escape(k) + r'\b', name_up):
            return True
    return False

def normalize_region(name):
    """Normalize region name to match DB."""
    name = str(name).strip()
    return NAME_ALIASES.get(name, name)

def update_pad_summary(year, daerah, data_dict):
    """Update main pad_data record via backend."""
    record = {
        'tahun': year,
        'daerah': daerah,
        **data_dict
    }
    requests.post(f"{BASE_URL}/batch", json={"records": [record]})

def clear_region_details(year, daerah):
    """Clear details via backend."""
    requests.post(f"{BASE_URL}/clear-details", json={"tahun": year, "daerah": daerah})

def import_details_batch(details):
    """Import details payload via backend in batches of 100."""
    batch_size = 100
    for i in range(0, len(details), batch_size):
        batch = details[i:i+batch_size]
        requests.post(f"{BASE_URL}/batch-detail", json={"records": batch})

def import_granular_from_master(file_path, file_type, target_regions=None):
    """
    Import granular detail from KABKOTA.xlsx or PROVINSI.xlsx.
    
    file_type: 'kabkota' or 'provinsi'
    target_regions: optional set of DB region names to process (if None, process all Java)
    """
    print(f"\n{'='*60}")
    print(f"Processing: {file_path}")
    print(f"{'='*60}")
    
    xl = pd.ExcelFile(file_path)
    
    pattern = re.compile(r'^([\d\.]+) - (.*?) \((Anggaran|Realisasi|Persen)\)$')
    
    total_imported = 0
    
    for sheet_name in xl.sheet_names:
        if not sheet_name.isdigit():
            continue
        year = int(sheet_name)
        if year < 2021 or year > 2024:
            continue
        
        print(f"\n--- Sheet: {sheet_name} (Year {year}) ---")
        
        df = pd.read_excel(xl, sheet_name=sheet_name)
        columns = df.columns.tolist()
        
        # Build column mapping
        col_mapping = {}
        for col in columns:
            match = pattern.match(str(col))
            if match:
                col_mapping[col] = {
                    'code': match.group(1),
                    'name': match.group(2),
                    'type': match.group(3).lower()
                }
        
        # Only process PAD-related columns (codes starting with 4.1)
        pad_cols = {k: v for k, v in col_mapping.items() if v['code'].startswith('4.1')}
        print(f"  Found {len(pad_cols)} PAD columns")
        
        for idx, row in df.iterrows():
            region_raw = str(row.get('Daerah', row.iloc[0])).strip()
            if not region_raw or region_raw == 'nan' or 'TOTAL' in region_raw.upper():
                continue
            
            region_name = normalize_region(region_raw)
            
            # Filter
            if target_regions:
                if region_name not in target_regions:
                    continue
            else:
                if not is_java_region(region_name):
                    continue
            
            print(f"  Processing: {region_name}")
            
            # Extract summary data
            summary_data = {
                'pajak_anggaran': clean_val(row.get('4.1.01 - Pajak Daerah (Anggaran)', 0)),
                'pajak_realisasi': clean_val(row.get('4.1.01 - Pajak Daerah (Realisasi)', 0)),
                'retribusi_anggaran': clean_val(row.get('4.1.02 - Retribusi Daerah (Anggaran)', 0)),
                'retribusi_realisasi': clean_val(row.get('4.1.02 - Retribusi Daerah (Realisasi)', 0)),
                'pengelolaan_anggaran': clean_val(row.get('4.1.03 - Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan (Anggaran)', 0)),
                'pengelolaan_realisasi': clean_val(row.get('4.1.03 - Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan (Realisasi)', 0)),
                'lain_pad_anggaran': clean_val(row.get('4.1.04 - Lain-lain PAD yang Sah (Anggaran)', 0)),
                'lain_pad_realisasi': clean_val(row.get('4.1.04 - Lain-lain PAD yang Sah (Realisasi)', 0))
            }
            
            # Update main pad_data (upsert)
            update_pad_summary(year, region_name, summary_data)
            
            # Clear old details
            clear_region_details(year, region_name)
            
            # Build detail records  
            code_data = {}  # code -> {ang, rel, name}
            for col_name, meta in pad_cols.items():
                code = meta['code']
                if meta['type'] == 'persen':
                    continue
                if code not in code_data:
                    code_data[code] = {'ang': 0.0, 'rel': 0.0, 'name': meta['name']}
                val = clean_val(row[col_name])
                if meta['type'] == 'anggaran':
                    code_data[code]['ang'] = val
                elif meta['type'] == 'realisasi':
                    code_data[code]['rel'] = val
            
            # Filter out zeros and build payload
            details_payload = []
            for code, vals in code_data.items():
                if vals['ang'] == 0 and vals['rel'] == 0:
                    continue
                
                details_payload.append({
                    'tahun': year,
                    'daerah': region_name,
                    'kategori_kode': code,
                    'anggaran': vals['ang'],
                    'realisasi': vals['rel']
                })
            
            if not details_payload:
                print(f"    No detail data found for {region_name}")
                continue
            
            # Batch insert details
            import_details_batch(details_payload)
            
            print(f"    Inserted {len(details_payload)} detail records")
            total_imported += 1
    
    return total_imported

def main():
    print("=" * 60)
    print("COMPREHENSIVE LRA DETAIL DATA MIGRATION")
    print("=" * 60)
    
    base = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets'
    
    # Files to process
    files = [
        (os.path.join(base, 'KABKOTA.xlsx'), 'kabkota'),
        (os.path.join(base, 'PROVINSI.xlsx'), 'provinsi')
    ]
    
    for file_path, ftype in files:
        if os.path.exists(file_path):
            import_granular_from_master(file_path, ftype)
        else:
            print(f"File not found: {file_path}")
    
    print(f"\n{'='*60}")
    print(f"MIGRATION COMPLETE!")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
