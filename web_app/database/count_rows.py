import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
xl = pd.ExcelFile(path)

for s in xl.sheet_names:
    df = xl.parse(s)
    print(f"Sheet '{s}': {len(df)} rows")
