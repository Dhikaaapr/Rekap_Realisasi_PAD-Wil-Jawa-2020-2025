import pandas as pd
import os

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None, nrows=20)

print(f"File: {os.path.basename(path)}, Sheet: {last_sheet}")
print("Checking first 10 rows, first 20 columns for region names...")

for i in range(10):
    row = df.iloc[i, :20].tolist()
    print(f"Row {i}: {row}")
