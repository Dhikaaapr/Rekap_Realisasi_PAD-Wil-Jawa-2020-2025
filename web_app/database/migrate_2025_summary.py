import pandas as pd
import re
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

JAVA_PROVINCES = ['DKI JAKARTA', 'JAWA BARAT', 'JAWA TENGAH', 'DI YOGYAKARTA', 'JAWA TIMUR', 'BANTEN']
JAVA_KEYWORDS = ['JAKARTA', 'BANDUNG', 'BOGOR', 'BEKASI', 'DEPOK', 'SEMARANG', 'SURAKARTA', 'YOGYAKARTA', 'SURABAYA', 'MALANG', 'SERANG', 'TANGERANG'] # Minimal for summary

def is_java_region(name):
    name_up = str(name).upper()
    if any(p in name_up for p in JAVA_PROVINCES): return True
    if any(k in name_up for k in JAVA_KEYWORDS): return True
    return False

def clean_val(val):
    if pd.isna(val) or val == 'nan': return 0.0
    try:
        return float(str(val).replace(',', ''))
    except:
        return 0.0

def migrate_2025():
    path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\lra_sheet.csv'
    print(f"Migrating 2025 Summary from {path}")
    df = pd.read_csv(path, header=None)
    
    # Based on earlier:
    # Col 1: Region Name
    # Col 2/3: Pajak Ang/Rel
    # Col 5/6: Retribusi Ang/Rel
    # Col 8/9: Pengelolaan Ang/Rel
    # Col 11/12: Lain PAD Ang/Rel
    
    for i in range(10, len(df)):
        row = df.iloc[i]
        name = str(row[1]).strip()
        if not name or name == 'nan' or 'TOTAL' in name.upper(): continue
        if not is_java_region(name): continue
        
        pajak_ang = clean_val(row[2])
        pajak_rel = clean_val(row[3])
        ret_ang = clean_val(row[5])
        ret_rel = clean_val(row[6])
        peng_ang = clean_val(row[8])
        peng_rel = clean_val(row[9])
        lain_ang = clean_val(row[11])
        lain_rel = clean_val(row[12])
        
        payload = {
            'tahun': 2025,
            'daerah': name,
            'pajak_anggaran': pajak_ang,
            'pajak_realisasi': pajak_rel,
            'retribusi_anggaran': ret_ang,
            'retribusi_realisasi': ret_rel,
            'pengelolaan_anggaran': peng_ang,
            'pengelolaan_realisasi': peng_rel,
            'lain_pad_anggaran': lain_ang,
            'lain_pad_realisasi': lain_rel
        }
        
        # Upsert
        supabase.table('pad_data').upsert(payload, on_conflict='tahun,daerah').execute()
        print(f"  2025 Summary for {name} imported.")

if __name__ == "__main__":
    migrate_2025()
