import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name=0, header=None, nrows=20)

for i in range(15):
    row = df.iloc[i].tolist()
    print(f"Row {i}: {row[:15]}")
