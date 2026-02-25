import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
df = pd.read_excel(path, sheet_name=-1, header=None)

for i in range(377, 400):
    row = df.iloc[i].tolist()
    clean_row = [f"[{j}]:{v}" for j, v in enumerate(row[:20]) if pd.notna(v)]
    print(f"Row {i}: {' | '.join(clean_row)}")
