import pandas as pd
import re
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def sync_codes():
    path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\KABKOTA.xlsx'
    xl = pd.ExcelFile(path)
    all_categories = {} # code -> name
    
    pattern = re.compile(r'^([\d\.]+) - (.*?) \((Anggaran|Realisasi|Persen)\)$')
    
    for sheet_name in xl.sheet_names:
        print(f"Checking sheet {sheet_name} for categories...")
        df = pd.read_excel(xl, sheet_name=sheet_name, nrows=1)
        for col in df.columns:
            match = pattern.match(str(col))
            if match:
                code = match.group(1)
                name = match.group(2).strip()
                if code not in all_categories:
                    all_categories[code] = name
                    
    print(f"Found {len(all_categories)} unique codes. Syncing to Supabase...")
    
    upsert_data = []
    for code, name in all_categories.items():
        parts = code.split('.')
        level = len(parts)
        k_utama = 'pad'
        if code.startswith('4.1.01'): k_utama = 'pajak'
        elif code.startswith('4.1.02'): k_utama = 'retribusi'
        elif code.startswith('4.1.03'): k_utama = 'pengelolaan'
        elif code.startswith('4.1.04'): k_utama = 'lain_pad'
        
        upsert_data.append({
            'kode': code,
            'nama': name,
            'nama_lengkap': name,
            'kategori_utama': k_utama,
            'level': level,
            'is_active': True
        })
        
    for i in range(0, len(upsert_data), 50):
        batch = upsert_data[i:i+50]
        supabase.table('ref_kategori_pad').upsert(batch, on_conflict='kode').execute()
        
    print("Category sync complete.")

if __name__ == "__main__":
    sync_codes()
