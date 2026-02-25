import pandas as pd
import re
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def main():
    path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\KABKOTA.xlsx'
    df = pd.read_excel(path, nrows=1)
    columns = df.columns.tolist()
    
    categories = {} # code -> name
    
    # Regex to capture "CODE - NAME (Type)"
    # Example: "4.1.01.01.01 - PKB-Mobil Penumpang-Sedan (Anggaran)"
    pattern = re.compile(r'^([\d\.]+) - (.*?) \((Anggaran|Realisasi|Persen)\)$')
    
    for col in columns:
        match = pattern.match(str(col))
        if match:
            code = match.group(1)
            name = match.group(2).strip()
            if code not in categories:
                categories[code] = name
    
    print(f"Found {len(categories)} unique categories in Excel.")
    
    # Sort by code length and then code value to ensure parents are processed if needed
    sorted_codes = sorted(categories.keys(), key=lambda x: (len(x.split('.')), x))
    
    upsert_data = []
    for code in sorted_codes:
        name = categories[code]
        parts = code.split('.')
        level = len(parts)
        
        # Determine kategori_utama
        kategori_utama = 'lain'
        if code.startswith('4.1.01'): kategori_utama = 'pajak'
        elif code.startswith('4.1.02'): kategori_utama = 'retribusi'
        elif code.startswith('4.1.03'): kategori_utama = 'pengelolaan'
        elif code.startswith('4.1.04'): kategori_utama = 'lain_pad'
        elif code.startswith('4.1'): kategori_utama = 'pad'
        
        parent_kode = '.'.join(parts[:-1]) if level > 1 else None
        
        upsert_data.append({
            'kode': code,
            'nama': name,
            'nama_lengkap': name,
            'kategori_utama': kategori_utama,
            'level': level,
            'parent_kode': parent_kode,
            'is_active': True
        })

    print(f"Upserting {len(upsert_data)} categories to Supabase...")
    # Batch upsert
    for i in range(0, len(upsert_data), 50):
        batch = upsert_data[i:i+50]
        supabase.table('ref_kategori_pad').upsert(batch, on_conflict='kode').execute()
        print(f"  Processed {i+len(batch)} items...")

    print("Category sync complete!")

if __name__ == "__main__":
    main()
