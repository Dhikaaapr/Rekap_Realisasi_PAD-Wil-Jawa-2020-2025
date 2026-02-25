import pandas as pd
import os

assets_path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets'
files = [
    'REALISASI PENDAPATAN TA 2023.xlsx',
    'REALISASI PENDAPATAN TA 2024.xlsx',
    'REALISASI PENDAPATAN TA 2025.xlsx'
]

for f in files:
    path = os.path.join(assets_path, f)
    print(f"\n{'='*20} {f} {'='*20}")
    try:
        df = pd.read_excel(path, sheet_name=-1, header=None, nrows=15)
        for i in range(15):
            print(f"Row {i}: {df.iloc[i, :15].tolist()}")
    except Exception as e:
        print(f"Error reading {f}: {e}")
