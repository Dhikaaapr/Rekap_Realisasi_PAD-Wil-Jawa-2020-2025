import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name='Database', header=None, nrows=20)

for i, row in df.iterrows():
    print(f"Row {i}: {list(row[:25])}")
