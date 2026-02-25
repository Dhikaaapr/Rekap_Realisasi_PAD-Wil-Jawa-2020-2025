import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name='LRA (sort)', header=None, nrows=15)

for i in range(15):
    row = [str(v) for v in df.iloc[i].tolist()]
    print(f"Row {i}: {row[:15]}")
