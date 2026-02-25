import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
xl = pd.ExcelFile(path)
df = xl.parse('LRA', nrows=15, header=None)

print("Headers for 'LRA' sheet (Row 8):")
row = df.iloc[8].tolist()
for j, v in enumerate(row):
    if pd.notna(v): print(f"[{j}]: {v}")

print("\nHeaders for 'LRA' sheet (Row 9):")
row = df.iloc[9].tolist()
for j, v in enumerate(row):
    if pd.notna(v): print(f"[{j}]: {v}")
