import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name='LRA (sort)', header=None, nrows=10)

print("Mapping for 'LRA (sort)' sheet Header (Row 8):")
row = df.iloc[8].tolist()
for j, v in enumerate(row):
    if pd.notna(v):
        print(f"Col {j}: {v}")
