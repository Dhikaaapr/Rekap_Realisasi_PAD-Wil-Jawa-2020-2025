import pandas as pd
import os

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

print(f"File: {os.path.basename(path)}, Sheet: {last_sheet}")

for i in range(min(15, len(df))):
    row_data = [str(val) for val in df.iloc[i] if pd.notna(val)]
    if row_data:
        print(f"Row {i}: {row_data}")
