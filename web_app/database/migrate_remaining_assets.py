"""
📥 Migrate Remaining Assets to Supabase
========================================
Files to migrate:
  1. Database TA 2021 Pendapatan Belanja.xlsx
  2. Database TA 2022 Pendapatan Belanja.xlsx (Sheet: LRA)
  3. Database TA 2023 Pendapatan Belanja Final.xlsx
  4. Database TA 2024 Pendapatan Belanja Final.xlsx
  5. Database Rekap 21 Des 2025 - TA 2025 1.xlsx (Sheet: LRA (sort) or LRA)

These files have a FIXED column layout:
  Col 0: NO
  Col 1: DAERAH
  Col 2: PAJAK ANGGARAN
  Col 3: PAJAK REALISASI
  Col 4: PAJAK %
  Col 5: RETRIBUSI ANGGARAN
  Col 6: RETRIBUSI REALISASI
  Col 7: RETRIBUSI %
  Col 8: PENGELOLAAN KEKAYAAN ANGGARAN
  Col 9: PENGELOLAAN KEKAYAAN REALISASI
  Col 10: PENGELOLAAN KEKAYAAN %
  Col 11: LAIN PAD ANGGARAN
  Col 12: LAIN PAD REALISASI
  Col 13: LAIN PAD %
  Col 14+: TOTAL PAD, TOTAL PENDAPATAN, BELANJA, etc.
  
Data rows start at Row 10 or 11 (after header rows).
"""

import pandas as pd
import re
import math
from supabase import create_client, Client

# Supabase credentials
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
    """Clean a cell value to float, handling NaN, strings, etc."""
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

def find_data_start_row(df):
    """Find the row where actual data starts (after headers)."""
    for i in range(len(df)):
        col1 = str(df.iloc[i, 1]).strip()
        # Data rows have region names like "Prov. Aceh", "Kab. xxx", "Kota xxx"
        if col1 and col1 != 'nan' and col1 != 'DAERAH':
            # Check if it looks like actual data (col 2 should be numeric)
            try:
                val = float(str(df.iloc[i, 2]).replace(',', ''))
                if val > 0:
                    return i
            except:
                continue
    return 11  # Default fallback

def migrate_fixed_layout(df, year, source_label):
    """
    Migrate data from a fixed-layout spreadsheet where:
    - Col 1 = DAERAH 
    - Cols 2,3,4 = PAJAK (Anggaran, Realisasi, %)
    - Cols 5,6,7 = RETRIBUSI (Anggaran, Realisasi, %)
    - Cols 8,9,10 = PENGELOLAAN (Anggaran, Realisasi, %)
    - Cols 11,12,13 = LAIN PAD (Anggaran, Realisasi, %)
    """
    start_row = find_data_start_row(df)
    print(f"  Data starts at row {start_row}, total rows: {len(df)}")
    
    migrated = 0
    skipped = 0
    updated = 0
    
    for i in range(start_row, len(df)):
        region_name = str(df.iloc[i, 1]).strip()
        if not region_name or region_name == 'nan': continue
        
        # Skip total/summary rows
        if any(k in region_name.upper() for k in ['TOTAL', 'JUMLAH', 'NASIONAL', 'INDONESIA', 'RATA']):
            continue
        
        # Filter Java regions only
        if not is_java_region(region_name):
            skipped += 1
            continue
        
        # Extract PAD data from fixed column positions
        pajak_ang = clean_val(df.iloc[i, 2])
        pajak_rel = clean_val(df.iloc[i, 3])
        ret_ang = clean_val(df.iloc[i, 5])
        ret_rel = clean_val(df.iloc[i, 6])
        peng_ang = clean_val(df.iloc[i, 8])
        peng_rel = clean_val(df.iloc[i, 9])
        lain_ang = clean_val(df.iloc[i, 11])
        lain_rel = clean_val(df.iloc[i, 12])
        
        # Skip if all zeros (empty row)
        if all(v == 0 for v in [pajak_ang, pajak_rel, ret_ang, ret_rel, peng_ang, peng_rel, lain_ang, lain_rel]):
            continue
        
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
        
        # Upsert: check if already exists
        existing = supabase.table('pad_data').select('id').eq('tahun', year).eq('daerah', region_name).execute()
        if existing.data:
            pad_id = existing.data[0]['id']
            supabase.table('pad_data').update(pad_payload).eq('id', pad_id).execute()
            updated += 1
        else:
            res = supabase.table('pad_data').insert(pad_payload).execute()
            if res.data:
                pad_id = res.data[0]['id']
                migrated += 1
            else:
                print(f"    ❌ Failed to insert: {region_name}")
                continue
        
        # Insert detail records for the 4 main PAD categories
        detail_records = []
        
        if pajak_ang != 0 or pajak_rel != 0:
            detail_records.append({
                'pad_data_id': pad_id, 'tahun': year, 'daerah': region_name,
                'kategori_kode': '4.1.01', 'anggaran': pajak_ang, 'realisasi': pajak_rel
            })
        if ret_ang != 0 or ret_rel != 0:
            detail_records.append({
                'pad_data_id': pad_id, 'tahun': year, 'daerah': region_name,
                'kategori_kode': '4.1.02', 'anggaran': ret_ang, 'realisasi': ret_rel
            })
        if peng_ang != 0 or peng_rel != 0:
            detail_records.append({
                'pad_data_id': pad_id, 'tahun': year, 'daerah': region_name,
                'kategori_kode': '4.1.03', 'anggaran': peng_ang, 'realisasi': peng_rel
            })
        if lain_ang != 0 or lain_rel != 0:
            detail_records.append({
                'pad_data_id': pad_id, 'tahun': year, 'daerah': region_name,
                'kategori_kode': '4.1.04', 'anggaran': lain_ang, 'realisasi': lain_rel
            })
        
        # Only insert details if there aren't already more detailed records (from KABKOTA/PROVINSI migration)
        existing_details = supabase.table('detail_pad_data').select('id', count='exact').eq('pad_data_id', pad_id).execute()
        existing_count = existing_details.count if hasattr(existing_details, 'count') and existing_details.count else len(existing_details.data)
        
        if existing_count <= 4:
            # There are no granular details yet, so insert the 4 main categories
            supabase.table('detail_pad_data').delete().eq('pad_data_id', pad_id).execute()
            if detail_records:
                supabase.table('detail_pad_data').insert(detail_records).execute()
    
    print(f"  ✅ Migrated: {migrated} new, {updated} updated, {skipped} non-Java skipped")
    return migrated + updated


def main():
    print("=" * 60)
    print("📥 MIGRATING REMAINING ASSET FILES TO SUPABASE")
    print("=" * 60)
    
    base = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets'
    total = 0
    
    # ========================================
    # 1. Database TA 2021 Pendapatan Belanja
    # ========================================
    print("\n📄 [1/5] Database TA 2021 Pendapatan Belanja.xlsx")
    f = f'{base}\\Database TA 2021 Pendapatan Belanja.xlsx'
    df = pd.read_excel(f, header=None)
    total += migrate_fixed_layout(df, 2021, "DB_2021")
    
    # ========================================
    # 2. Database TA 2022 Pendapatan Belanja
    # ========================================
    print("\n📄 [2/5] Database TA 2022 Pendapatan Belanja.xlsx (Sheet: LRA)")
    f = f'{base}\\Database TA 2022 Pendapatan Belanja.xlsx'
    df = pd.read_excel(f, sheet_name='LRA', header=None)
    total += migrate_fixed_layout(df, 2022, "DB_2022")
    
    # ========================================
    # 3. Database TA 2023 Pendapatan Belanja Final
    # ========================================
    print("\n📄 [3/5] Database TA 2023 Pendapatan Belanja Final.xlsx")
    f = f'{base}\\Database TA 2023 Pendapatan Belanja Final.xlsx'
    df = pd.read_excel(f, sheet_name='Rekap LRA 2023', header=None)
    total += migrate_fixed_layout(df, 2023, "DB_2023")
    
    # ========================================
    # 4. Database TA 2024 Pendapatan Belanja Final
    # ========================================
    print("\n📄 [4/5] Database TA 2024 Pendapatan Belanja Final.xlsx")
    f = f'{base}\\Database TA 2024 Pendapatan Belanja Final.xlsx'
    # Use the main sheet (Rekap LRA 2024), not the aggregate
    df = pd.read_excel(f, sheet_name='Rekap LRA 2024', header=None)
    total += migrate_fixed_layout(df, 2024, "DB_2024")
    
    # ========================================
    # 5. Database Rekap 21 Des 2025 - TA 2025 1
    # ========================================
    print("\n📄 [5/5] Database Rekap 21 Des 2025 - TA 2025 1.xlsx (Sheet: LRA)")
    f = f'{base}\\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
    # Use the 'LRA' sheet which has most data (575 rows)
    df = pd.read_excel(f, sheet_name='LRA', header=None)
    total += migrate_fixed_layout(df, 2025, "REKAP_2025")
    
    # ========================================
    # VERIFICATION
    # ========================================
    print("\n" + "=" * 60)
    print("📊 VERIFICATION - Current Supabase Status")
    print("=" * 60)
    
    for y in [2021, 2022, 2023, 2024, 2025]:
        res = supabase.table('pad_data').select('id', count='exact').eq('tahun', y).execute()
        p_count = res.count if hasattr(res, 'count') else len(res.data)
        
        res_d = supabase.table('detail_pad_data').select('id', count='exact').eq('tahun', y).execute()
        d_count = res_d.count if hasattr(res_d, 'count') else len(res_d.data)
        
        print(f"  Year {y}: Main={p_count}, Details={d_count}")
    
    res_cat = supabase.table('ref_kategori_pad').select('id', count='exact').execute()
    cat_count = res_cat.count if hasattr(res_cat, 'count') else len(res_cat.data)
    print(f"  Categories: {cat_count}")
    
    print(f"\n🎉 Migration complete! Total regions processed: {total}")
    print("=" * 60)


if __name__ == "__main__":
    main()
