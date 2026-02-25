import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name='LRA (sort)', header=None, nrows=10)

print("Row 8 (Main Headers):")
for j, v in enumerate(df.iloc[8]):
    if pd.notna(v): print(f"[{j}]: {v}")

print("\nRow 9 (Sub Headers):")
for j, v in enumerate(df.iloc[9]):
    if pd.notna(v): print(f"[{j}]: {v}")
