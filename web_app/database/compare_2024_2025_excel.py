
import pandas as pd
import os

files = [
    (r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2024.xlsx', 2024),
    (r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx', 2025)
]

for f, y in files:
    if not os.path.exists(f):
        print(f"Missing: {f}")
        continue
    
    xl = pd.ExcelFile(f)
    last_sheet = xl.sheet_names[-1]
    df = pd.read_excel(f, sheet_name=last_sheet, header=None)
    
    # Count rows that have data in the "Uraian" column (col 6)
    valid_rows = df[df.iloc[:, 6].notna() & (df.iloc[:, 6].astype(str).str.strip() != '')]
    
    print(f"\nYear {y} File: {os.path.basename(f)}")
    print(f"Total rows in sheet '{last_sheet}': {len(df)}")
    print(f"Rows with content in Uraian (col 6): {len(valid_rows)}")
    
    # Sample some deep codes
    # Usually codes are built from col 0-4
    has_code = df[df.iloc[:, 0].notna() | df.iloc[:, 1].notna()]
    print(f"Rows with potential codes: {len(has_code)}")
