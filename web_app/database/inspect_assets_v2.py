import pandas as pd
import os

assets_path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets'
files = [
    'REALISASI PENDAPATAN TA 2023.xlsx',
    'REALISASI PENDAPATAN TA 2024.xlsx',
    'REALISASI PENDAPATAN TA 2025.xlsx'
]

with open('header_inspection.txt', 'w', encoding='utf-8') as out:
    for f in files:
        path = os.path.join(assets_path, f)
        out.write(f"\n{'='*20} {f} {'='*20}\n")
        try:
            df = pd.read_excel(path, sheet_name=-1, header=None, nrows=20)
            for i in range(20):
                row_vals = [str(x) for x in df.iloc[i, :20].tolist()]
                out.write(f"Row {i}: {' | '.join(row_vals)}\n")
        except Exception as e:
            out.write(f"Error reading {f}: {e}\n")

print("Inspection complete. Check header_inspection.txt")
