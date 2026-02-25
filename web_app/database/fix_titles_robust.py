
from supabase import create_client, Client
import json

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

# Robust nomenclature map based on common Indonesian Government Accounting Standards (SAP/SIPD)
# and mapping the Sukoharjo 2024 patterns.
NOMENCLATURE = {
    # ROOTS
    "4": "PENDAPATAN DAERAH",
    "4.1": "PENDAPATAN ASLI DAERAH (PAD)",
    "4.1.0": "PENDAPATAN ASLI DAERAH",
    
    # PAJAK (Variations)
    "4.1.0.1": "Pajak Daerah",
    "4.1.0.1.0": "Pajak Daerah",
    "4.1.01": "Pajak Daerah",
    "4.1.1": "Pajak Daerah",
    
    # RETRIBUSI (Variations)
    "4.1.0.2": "Retribusi Daerah",
    "4.1.0.2.0": "Retribusi Daerah",
    "4.1.02": "Retribusi Daerah",
    "4.1.2": "Retribusi Daerah",
    
    # KEKAYAAN DIPISAHKAN
    "4.1.0.3": "Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan",
    "4.1.0.3.0": "Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan",
    "4.1.03": "Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan",
    "4.1.3": "Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan",
    
    # LAIN-LAIN PAD
    "4.1.0.4": "Lain-lain PAD yang Sah",
    "4.1.0.4.0": "Lain-lain PAD yang Sah",
    "4.1.04": "Lain-lain PAD yang Sah",
    "4.1.4": "Lain-lain PAD yang Sah",
    
    # SPECIFIC TAXES (Common Pattern matching)
    "4.1.0.1.0.6": "Pajak Hotel",
    "4.1.0.1.0.7": "Pajak Restoran",
    "4.1.0.1.0.8": "Pajak Hiburan",
    "4.1.0.1.0.9": "Pajak Reklame",
    "4.1.0.1.0.10": "Pajak Penerangan Jalan",
    "4.1.0.1.0.11": "Pajak Parkir",
    "4.1.0.1.0.12": "Pajak Air Tanah",
    "4.1.0.1.0.15": "PBB-P2",
    "4.1.0.1.0.16": "BPHTB",
    "4.1.0.1.0.19": "PBJT (Pajak Barang dan Jasa Tertentu)",
    
    # PBJT Components (Sub-codes for 4.1.0.1.0.19)
    "4.1.0.1.0.19.0.1.0": "PBJT Makanan dan/atau Minuman",
    "4.1.0.1.0.19.0.2.0": "PBJT Tenaga Listrik",
    "4.1.0.1.0.19.0.3.0": "PBJT Jasa Perhotelan",
    "4.1.0.1.0.19.0.4.0": "PBJT Jasa Parkir",
    "4.1.0.1.0.19.0.5.0": "PBJT Jasa Kesenian dan Hiburan",
    
    # Common Retribusi
    "4.1.0.2.0.1": "Retribusi Jasa Umum",
    "4.1.0.2.0.2": "Retribusi Jasa Usaha",
    "4.1.0.2.0.3": "Retribusi Perizinan Tertentu",
    
    # Transfer
    "4.2": "PENDAPATAN TRANSFER",
    "4.2.0": "PENDAPATAN TRANSFER",
    "4.2.1": "Pendapatan Transfer Pemerintah Pusat",
    "4.2.2": "Pendapatan Transfer Antar Daerah",
}

def apply_nomenclature():
    print("Applying master nomenclature to ref_kategori_pad...")
    
    # 1. Update with our hardcoded constants
    for code, name in NOMENCLATURE.items():
        try:
            supabase.table('ref_kategori_pad').upsert({
                'kode': code,
                'nama': name,
                'kategori_utama': 'PAD' if code.startswith('4.1') else 'Transfer'
            }, on_conflict='kode').execute()
        except: pass

    # 2. Use the template from Sukoharjo 2024 to fill in more
    try:
        with open('lra_template.json', 'r') as f:
            template = json.load(f)
            for item in template:
                code = item['kode']
                name = item['nama']
                if code and name and name != code:
                    try:
                        supabase.table('ref_kategori_pad').upsert({
                            'kode': code,
                            'nama': name,
                            'kategori_utama': 'PAD' if code.startswith('4.1') else 'Transfer'
                        }, on_conflict='kode').execute()
                    except: pass
    except:
        print("Template file not found or invalid.")

    # 3. Handle sub-codes that might be slightly different
    # e.g. mapping 4.1.0.1.0.6.0.1.0 to "Pajak Hotel" if 4.1.0.1.0.6 is "Pajak Hotel"
    print("Expanding names to sub-codes...")
    res = supabase.table('ref_kategori_pad').select('kode, nama').execute()
    existing = {d['kode']: d['nama'] for d in res.data}
    
    # Fetch all detail codes to see what needs naming
    # We'll just do a broad update based on prefixes
    updates = []
    
    # This is a bit slow if done one by one, but let's target the ones in the screenshot
    # Or better: check ALL ref entries and if they are just the code, try to find a parent's name
    for code, name in existing.items():
        if name == code or not name:
            # Try to find a meaningful name from a parent prefix
            parts = code.split('.')
            for i in range(len(parts)-1, 0, -1):
                parent_code = ".".join(parts[:i])
                if parent_code in NOMENCLATURE:
                    existing[code] = NOMENCLATURE[parent_code]
                    updates.append({'kode': code, 'nama': NOMENCLATURE[parent_code]})
                    break
    
    if updates:
        print(f"Pushing {len(updates)} inferred names...")
        for i in range(0, len(updates), 100):
            batch = updates[i:i+100]
            try: supabase.table('ref_kategori_pad').upsert(batch, on_conflict='kode').execute()
            except: pass

apply_nomenclature()
