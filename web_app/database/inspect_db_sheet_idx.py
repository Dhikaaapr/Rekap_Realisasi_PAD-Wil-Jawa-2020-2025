import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
xl = pd.ExcelFile(path)
print(f"Sheets: {xl.sheet_names}")

# Use first sheet index
df = pd.read_excel(path, sheet_name=0, header=None, nrows=30)

for i, row in df.iterrows():
    # Only print first 20 cols
    print(f"Row {i}: {list(row[:20])}")
