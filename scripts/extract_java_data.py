import pandas as pd
import numpy as np

def clean_value(val):
    if pd.isna(val) or val == 'nan' or val == '-':
        return 0.0
    try:
        if isinstance(val, str):
            val = val.replace(',', '')
        return float(val)
    except:
        return 0.0

target_provinces = ['DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur']

# Read the CSV dump of the LRA sheet
df = pd.read_csv('assets/lra_sheet.csv', header=None)

results = []
capture = False

for i, row in df.iterrows():
    daerah = str(row[1]).strip()
    
    # Check if this is a starting province for Java
    if any(p in daerah for p in target_provinces) and 'Prov.' in daerah:
        capture = True
        
    if capture:
        # Stop capturing if we hit another province that is not in Java (after starting capture)
        if 'Prov.' in daerah and not any(p in daerah for p in target_provinces) and i > 255:
            capture = False
            continue
            
        # Skip garbage rows
        if pd.isna(row[1]) or daerah == 'nan' or daerah == 'DAERAH' or daerah == '':
            continue
            
        # Skip summary rows that are not province headers
        if 'Total' in daerah and 'Prov.' not in daerah:
            continue
            
        # Map row to our structure
        try:
            results.append({
                'TAHUN': 2025,
                'NOMOR_URUT': str(row[0]) if not pd.isna(row[0]) else '',
                'DAERAH': daerah,
                'PAJAK_ANGGARAN': clean_value(row[2]),
                'PAJAK_REALISASI': clean_value(row[3]),
                'RETRIBUSI_ANGGARAN': clean_value(row[5]),
                'RETRIBUSI_REALISASI': clean_value(row[6]),
                'KEKAYAAN_ANGGARAN': clean_value(row[8]),
                'KEKAYAAN_REALISASI': clean_value(row[9]),
                'LAIN_ANGGARAN': clean_value(row[11]),
                'LAIN_REALISASI': clean_value(row[12])
            })
        except Exception as e:
            print(f"Error processing row {i}: {e}")

clean_df = pd.DataFrame(results)

# Optional: Further cleaning for Java specifics if needed
# (e.g. Prov. DKI Jakarta row index 175)

clean_df.to_csv('assets/datarekap_2025_clean.csv', index=False)
print(f"✅ Successfully extracted {len(clean_df)} records to assets/datarekap_2025_clean.csv")
