import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name=0, header=None, nrows=100)

for i in range(10, 100):
    region = df.iloc[i, 1]
    if pd.notna(region):
        print(f"Row {i}: {region}")
