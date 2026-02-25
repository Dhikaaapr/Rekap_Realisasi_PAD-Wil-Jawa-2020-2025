import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import difflib


url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def normalize_text(text):
    if not isinstance(text, str): return ""
    return text.lower().strip().replace('\n', ' ').replace('/', ' ')

def main():
    print("Starting Import Detailed Data 2025...")
    
    # 1. Fetch Categories
    print("Fetching categories from Supabase...")
    res = supabase.table('ref_kategori_pad').select('kode, nama, nama_lengkap').execute()
    categories = res.data
    print(f"Loaded {len(categories)} categories.")
    
    # 2. Read Excel
    path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
    print(f"Reading Excel: {path}")
    
    # Read without header to process headers manually
    df = pd.read_excel(path, sheet_name=-1, header=None)
    
    # Header rows analysis (Rows 10-14 usually contain headers based on previous checks)
    # We will concatenate row values 10, 11, 12 to form a full header name for each column
    header_map = {} # col_index -> category_kode
    
    # Synonym mapping (Excel Header -> DB Kode)
    synonyms = {
        'pkb': 'PAJ-PROV-PKB',
        'bea balik nama kendaraan bermotor': 'PAJ-PROV-BBNKB',
        'bbnkb': 'PAJ-PROV-BBNKB',
        'pbbkb': 'PAJ-PROV-PBBKB',
        'pajak air permukaan': 'PAJ-PROV-PAP',
        'pap': 'PAJ-PROV-PAP',
        'pajak rokok': 'PAJ-PROV-ROKOK',
        'opsen pajak mblb': 'PAJ-PROV-OPSEN-MBLB',
        'pbb-p2': 'PAJ-KK-PBBP2',
        'bphtb': 'PAJ-KK-BPHTB',
        'pbjt': 'PAJ-KK-PBJT',
        'pajak barang dan jasa tertentu': 'PAJ-KK-PBJT',
        'reklame': 'PAJ-KK-REKLAME',
        'pat': 'PAJ-KK-PAT',
        'air tanah': 'PAJ-KK-PAT',
        'mblb': 'PAJ-KK-MBLB',
        'sarang burung walet': 'PAJ-KK-WALET',
        'opsen pkb': 'PAJ-KK-OPSEN-PKB',
        'opsen bbnkb': 'PAJ-KK-OPSEN-BBNKB',
        'makanan dan minuman': 'PBJT-MAKMIN',
        'tenaga listrik': 'PBJT-LISTRIK',
        'jasa perhotelan': 'PBJT-HOTEL',
        'jasa parkir': 'PBJT-PARKIR',
        'kesenian dan hiburan': 'PBJT-HIBURAN',
        'kesehatan': 'RET-JU-KESEHATAN',
        'kebersihan': 'RET-JU-KEBERSIHAN',
        'parkir di tepi jalan umum': 'RET-JU-PARKIR',
        'pelayanan pasar': 'RET-JU-PASAR',
        'pengendalian lalu lintas': 'RET-JU-LALIN',
        'tera': 'RET-JU-TERA', # Jika ada
        'pendidikan': 'RET-JU-PENDIDIKAN', # Jika ada
        'penggunaan kekayaan daerah': 'RET-JUS-TEMPAT-USAHA', # Approx
        'tempat pelelangan': 'RET-JUS-PELELANGAN',
        'tempat penginapan': 'RET-JUS-PENGINAPAN',
        'rumah potong hewan': 'RET-JUS-RPH',
        'pelabuhan': 'RET-JUS-PELABUHAN',
        'tempat rekreasi': 'RET-JUS-REKREASI',
        'penyeberangan di air': 'RET-JUS-PENYEBERANGAN',
        'penjualan produksi usaha daerah': 'RET-JUS-PRODUK',
        'bangunan gedung': 'RET-PT-PBG',
        'tenaga kerja asing': 'RET-PT-TKA',
        'pertambangan rakyat': 'RET-PT-TAMBANG'
    }

    print("\nScanning Columns for Categories...")
    
    for col_idx in range(6, df.shape[1]): # Start from col 6 (based on earlier check)
        # Construct header text from rows 10, 11, 12 (indices 9, 10, 11)
        h1 = str(df.iloc[9, col_idx]) if pd.notna(df.iloc[9, col_idx]) else ""
        h2 = str(df.iloc[10, col_idx]) if pd.notna(df.iloc[10, col_idx]) else ""
        h3 = str(df.iloc[11, col_idx]) if pd.notna(df.iloc[11, col_idx]) else ""
        
        full_header = normalize_text(f"{h1} {h2} {h3}")
        
        if col_idx < 15: # Print first few columns to debug
             print(f"DEBUG Header Col {col_idx}: '{full_header}'")
        
        # Try finding exact synonym match first
        best_match = None
        highest_ratio = 0
        
        for key_syn, code_syn in synonyms.items():
            if key_syn in full_header:
                # Find category object for this code
                for cat in categories:
                    if cat['kode'] == code_syn:
                        best_match = cat
                        highest_ratio = 1.0
                        break
                if best_match: break

        # If no synonym match, try fuzzy match with DB names
        if not best_match:
            for cat in categories:
                cat_name = normalize_text(cat['nama'])
                cat_full = normalize_text(cat['nama_lengkap'])
                
                # Direct text search
                if cat_name in full_header or cat_full in full_header:
                    ratio = 0.9
                else:
                    # Fuzzy match
                    ratio = difflib.SequenceMatcher(None, cat_name, full_header).ratio()
                    
                if ratio > highest_ratio and ratio > 0.6: # Threshold
                    highest_ratio = ratio
                    best_match = cat
                
        if best_match:
            # Check if this column is Anggaran or Realisasi
            # Usually Row 11 (index 10) or Row 7 (index 6) has 'ANGGARAN' or 'REALISASI'
            # Let's check row 6 (index 5) or look at patterns
            # Based on dump: there are sets of columns for each item.
            # We need to distinguish Anggaran vs Realisasi.
            # Let's assume columns come in pairs? Or look for keywords in headers.
            
            type_ = "unknown"
            if "realisasi" in full_header or "s.d" in full_header:
                type_ = "realisasi"
            elif "anggaran" in full_header or "target" in full_header or "apbd" in full_header:
                type_ = "anggaran"
            
            # Simple heuristic: if we match a category, we need to know if it's budget/realization
            # If we can't determine, maybe skip?
            # Or print for now to debug.
            
            print(f"Col {col_idx}: Header='{full_header[:30]}...' -> Match='{best_match['nama']}' ({type_})")
            if type_ != "unknown":
                if col_idx not in header_map: header_map[col_idx] = {}
                header_map[col_idx] = {'kode': best_match['kode'], 'type': type_}

    print(f"\nMapped {len(header_map)} columns to categories.")
    print("DEBUG: Mapped Columns:", header_map) # ADDED DEBUG
    
    # 3. Process Data Rows
    # Regions seem to start around Row 15 (Index 14) - based on dump: Row 15 has 'Kab. Aceh Jaya' (example)
    # Let's start from row 14
    
    print("\nProcessing Data Rows...")
    
    current_year = 2025 # Hardcoded for this file
    
    for row_idx in range(14, df.shape[0]):
        # Get Region Name from Column 1 (Index 0 is Number, Index 1 is Name?)
        # Let's verify with dump: Row 15: [(0, 'Kab. Aceh Jaya')] -> Wait index is 0?
        # Let's try Column 0 first, if numeric then verify Col 1.
        
        col0 = str(df.iloc[row_idx, 0]).strip()
        col1 = str(df.iloc[row_idx, 1]).strip()
        
        region_name = ""
        if len(col1) > 3 and not col1.replace('.','').isdigit():
            region_name = col1
        elif len(col0) > 3 and not col0.replace('.','').isdigit():
            region_name = col0
            
        if not region_name or "nan" in region_name.lower():
            continue
            
        print(f"Processing: {region_name}")
        
        # 3.1 Get/Create pad_data Record
        # We need a parent record in 'pad_data' first
        # Check if exists
        
        # Normalize Region Name for DB
        # TODO: Better standardization (Province vs Kota vs Kab)
        
        existing = supabase.table('pad_data').select('id').eq('tahun', current_year).eq('daerah', region_name).execute()
        
        pad_id = None
        if existing.data:
            pad_id = existing.data[0]['id']
        else:
            # Create new pad_data record
            # We don't have totals here yet, maybe we can sum them up later OR just create placeholder
            new_pad = {
                'tahun': current_year,
                'daerah': region_name,
                # We can update totals later
            }
            res = supabase.table('pad_data').insert(new_pad).execute()
            if res.data:
                pad_id = res.data[0]['id']
            else:
                print(f"Failed to create pad_data for {region_name}")
                continue
        
        # 3.2 Insert Details
        # Collect all details for this row
        details_to_insert = []
        
        for col_idx, meta in header_map.items():
            category_code = meta['kode']
            val_type = meta['type'] # 'anggaran' or 'realisasi'
            
            raw_val = df.iloc[row_idx, col_idx]
            
            # Clean value
            val = 0.0
            try:
                if pd.notna(raw_val):
                    val = float(str(raw_val).replace(',', ''))
            except:
                val = 0.0
                
            # We need to upsert or group by category code
            # Since we iterate columns, let's store in a dict first
            # row_data_map[category_code] = {'anggaran': 0, 'realisasi': 0}
            
        # Refactor processing to group by category first
        row_details = {} # code -> {anggaran: 0, realisasi: 0}
        
        for col_idx, meta in header_map.items():
            cat_code = meta['kode']
            val_type = meta['type']
            
            raw_val = df.iloc[row_idx, col_idx]
            val = 0.0
            try:
                if pd.notna(raw_val):
                    val = float(str(raw_val).replace(',', ''))
            except:
                val = 0.0
                
            if cat_code not in row_details:
                row_details[cat_code] = {'anggaran': 0, 'realisasi': 0}
                
            row_details[cat_code][val_type] = val

        # Now insert into DB
        for cat_code, values in row_details.items():
            # Upsert detailed data
            # Check if exists
            det_check = supabase.table('detail_pad_data').select('id').eq('pad_data_id', pad_id).eq('kategori_kode', cat_code).execute()
            
            detail_payload = {
                'pad_data_id': pad_id,
                'tahun': current_year,
                'daerah': region_name,
                'kategori_kode': cat_code,
                'anggaran': values['anggaran'],
                'realisasi': values['realisasi']
            }
            
            if det_check.data:
                # Update
                det_id = det_check.data[0]['id']
                res = supabase.table('detail_pad_data').update(detail_payload).eq('id', det_id).execute()
                if not res.data:
                     print(f"Failed to UPDATE detail: {cat_code} for {region_name}")
            else:
                # Insert
                res = supabase.table('detail_pad_data').insert(detail_payload).execute()
                if not res.data:
                     print(f"Failed to INSERT detail: {cat_code} for {region_name}")
                else:
                     # Print success for first item only to reduce spam
                     pass 
            
        print(f"Saved details for {region_name}")

    print("\nAll Data Processed Successfully!")

main()
