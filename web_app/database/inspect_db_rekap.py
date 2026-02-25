import pandas as pd
import os

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
xl = pd.ExcelFile(path)
print(f"File: {os.path.basename(path)}")
print(f"Sheets: {xl.sheet_names}")

# Check first sheet
df = pd.read_excel(path, sheet_name=0, header=None, nrows=10)
print("\nFirst sheet, first 10 rows:")
for i, row in df.iterrows():
    print(f"Row {i}: {list(row[:15])}")
