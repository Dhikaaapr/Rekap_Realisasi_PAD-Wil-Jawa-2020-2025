import pandas as pd
import os

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database TA 2024 Pendapatan Belanja Final.xlsx'
xl = pd.ExcelFile(path)
print(f"File: {os.path.basename(path)}")
print(f"Sheets: {xl.sheet_names}")

# Check first sheet's headers
df = pd.read_excel(path, sheet_name=0, header=None, nrows=10)
print("\nHeaders (Row 0):")
row = df.iloc[0].tolist()
for j, v in enumerate(row):
    if pd.notna(v): print(f"[{j}]: {v}")
