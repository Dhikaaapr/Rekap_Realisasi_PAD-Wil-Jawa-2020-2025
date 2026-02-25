import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name='LRA (sort)', header=None, nrows=15)

for i in [8, 9, 10, 11, 12]:
    row = df.iloc[i].tolist()
    clean_row = [f"[{j}]:{v}" for j, v in enumerate(row[:30]) if pd.notna(v)]
    print(f"Row {i}: {' | '.join(clean_row)}")
