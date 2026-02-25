import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
df = pd.read_excel(path, sheet_name=-1, header=None, nrows=6)

print("\n--- Header Rows 0-5 ---")
for i in range(6):
    row_vals = []
    for j, val in enumerate(df.iloc[i]):
        if pd.notna(val):
            row_vals.append(f"{j}:{str(val).strip()}")
    print(f"Row {i}: {row_vals}")
