import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name=0, header=None, nrows=15)

for i in range(15):
    row_text = " | ".join([f"[{j}]:{v}" for j, v in enumerate(df.iloc[i]) if pd.notna(v)])
    if row_text:
        print(f"Row {i}: {row_text}")
