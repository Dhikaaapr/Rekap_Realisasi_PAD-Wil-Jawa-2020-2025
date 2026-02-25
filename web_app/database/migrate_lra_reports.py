import pandas as pd
import os
import math
import requests
import json

BASE_URL = "http://localhost:3000/api/pad"

def migrate_lra(file_path, year):
    # Determine the last sheet (usually December)
    xl = pd.ExcelFile(file_path)
    last_sheet = xl.sheet_names[-1]
    print(f"\nMigrating LRA Report: {file_path} ({year}) - Sheet: {last_sheet}")
    
    df = pd.read_excel(file_path, sheet_name=last_sheet, header=None)
    
    # Find the region name (usually Row 1, Col 0)
    region_raw = str(df.iloc[1, 0])
    region_name = "Kab. Sukoharjo" # Default fallback
    if "KABUPATEN" in region_raw.upper():
        region_name = "Kab. " + region_raw.upper().split("KABUPATEN")[-1].split("TAHUN")[0].strip().title()
    elif "KOTA" in region_raw.upper():
        region_name = "Kota " + region_raw.upper().split("KOTA")[-1].split("TAHUN")[0].strip().title()
    elif "PROVINSI" in region_raw.upper():
        region_name = "Prov. " + region_raw.upper().split("PROVINSI")[-1].split("TAHUN")[0].strip().title()

    print(f"  Target Region: {region_name}")

    # 1. Update/Create pad_data parent via batch endpoint (upsert)
    # Since we don't have totals yet, we'll just ensure the parent exists
    parent_record = {
        'tahun': year,
        'daerah': region_name
    }
    
    print(f"  Ensuring pad_data record exists...")
    resp = requests.post(f"{BASE_URL}/batch", json={"records": [parent_record]})
    if resp.status_code != 200:
        print(f"  ❌ Error creating parent: {resp.text}")

    # 1b. Clear existing details
    print(f"  Clearing existing details for {region_name} ({year})...")
    requests.post(f"{BASE_URL}/clear-details", json={"daerah": region_name, "tahun": year})

    # 2. Iterate rows and find PAD components
    details = []
    for i in range(6, len(df)):
        try:
            row = df.iloc[i]
            name = str(row[6]).strip()
            if not name or name == 'nan' or name == 'uraian': continue
            
            code_parts = [str(row[j]) for j in range(5) if pd.notna(row[j]) and str(row[j]).strip()]
            if not code_parts: continue
            
            code = ".".join(code_parts)
            
            anggaran = 0.0
            try: anggaran = float(str(row[7]).replace(',', ''))
            except: pass
            
            realisasi = 0.0
            try: realisasi = float(str(row[11]).replace(',', ''))
            except: pass
            
            if anggaran == 0 and realisasi == 0: continue

            details.append({
                'tahun': year,
                'daerah': region_name,
                'kategori_kode': code,
                'anggaran': anggaran,
                'realisasi': realisasi
            })
        except Exception as e:
            continue

    # 2b. Extract totals for pad_data summary fields
    summary = {
        'pajak_anggaran': 0.0, 'pajak_realisasi': 0.0,
        'retribusi_anggaran': 0.0, 'retribusi_realisasi': 0.0,
        'pengelolaan_anggaran': 0.0, 'pengelolaan_realisasi': 0.0,
        'lain_pad_anggaran': 0.0, 'lain_pad_realisasi': 0.0
    }
    for d in details:
        if d['kategori_kode'] == '4.1.01':
            summary['pajak_anggaran'] = d['anggaran']
            summary['pajak_realisasi'] = d['realisasi']
        elif d['kategori_kode'] == '4.1.02':
            summary['retribusi_anggaran'] = d['anggaran']
            summary['retribusi_realisasi'] = d['realisasi']
        elif d['kategori_kode'] == '4.1.03':
            summary['pengelolaan_anggaran'] = d['anggaran']
            summary['pengelolaan_realisasi'] = d['realisasi']
        elif d['kategori_kode'] == '4.1.04':
            summary['lain_pad_anggaran'] = d['anggaran']
            summary['lain_pad_realisasi'] = d['realisasi']
    
    # Update parent with actual totals
    parent_record.update(summary)
    print(f"  Updating pad_data summary with extracted totals...")
    requests.post(f"{BASE_URL}/batch", json={"records": [parent_record]})

    # 3. Send in batches of 100
    batch_size = 100
    total_imported = 0
    
    print(f"  Sending {len(details)} detail records to backend in batches of {batch_size}...")
    
    for i in range(0, len(details), batch_size):
        batch = details[i:i+batch_size]
        try:
            resp = requests.post(f"{BASE_URL}/batch-detail", json={"records": batch})
            if resp.status_code == 200:
                total_imported += len(batch)
                print(f"    ✅ Imported {total_imported}/{len(details)}")
            else:
                print(f"    ❌ Error batch {i//batch_size + 1}: {resp.text}")
        except Exception as e:
            print(f"    ❌ Exception batch {i//batch_size + 1}: {e}")

    print(f"  Done for {region_name}")

def main():
    reports = [
        (r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2023.xlsx', 2023),
        (r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2024.xlsx', 2024),
        (r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx', 2025),
    ]
    for r, y in reports:
        if os.path.exists(r):
            migrate_lra(r, y)
        else:
            print(f"Skipping missing file: {r}")

if __name__ == "__main__":
    main()
